import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export interface AstTransformOptions {
  syntax: 'typescript' | 'javascript';
  preserveComments: boolean;
  target: 'react-vite' | 'react-cra';
}

/**
 * AST alapú transzformáció Next.js kódból React kódba
 */
export function transformWithAst(
  sourceCode: string,
  options: Partial<AstTransformOptions> = {}
): { code: string; warnings: string[]; changes: string[] } {
  const warnings: string[] = [];
  const changes: string[] = [];
  
  const defaultOptions: AstTransformOptions = {
    syntax: 'typescript',
    preserveComments: true,
    target: 'react-vite'
  };
  
  const opts = { ...defaultOptions, ...options };
  
  try {
    // Kód AST-vé alakítása
    const ast = parser.parse(sourceCode, {
      sourceType: 'module',
      plugins: [
        opts.syntax === 'typescript' ? 'typescript' : null,
        'jsx',
        'decorators-legacy',
        'classProperties'
      ].filter(Boolean) as parser.ParserPlugin[],
      tokens: true
    });
    
    // Next.js specifikus importok transzformálása
    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        
        // Next.js importok átalakítása
        if (source === 'next/image') {
          path.node.source.value = '@unpic/react';
          changes.push('next/image import átalakítva @unpic/react importra');
        } else if (source === 'next/link') {
          path.node.source.value = 'react-router-dom';
          changes.push('next/link import átalakítva react-router-dom importra');
        } else if (source === 'next/head') {
          path.node.source.value = 'react-helmet-async';
          changes.push('next/head import átalakítva react-helmet-async importra');
        } else if (source === 'next/router') {
          path.node.source.value = 'react-router-dom';
          changes.push('next/router import átalakítva react-router-dom importra');
        } else if (source === 'next/dynamic') {
          // Speciális eset: dynamic importot React.lazy-re cseréljük
          const hasSpecifier = path.node.specifiers.some(spec => {
            if (t.isImportSpecifier(spec) && spec.imported && t.isIdentifier(spec.imported)) {
              return spec.imported.name === 'dynamic';
            } else if (t.isImportDefaultSpecifier(spec)) {
              return true;
            }
            return false;
          });
          
          if (hasSpecifier) {
            // Új import deklaráció létrehozása
            const newImport = t.importDeclaration(
              [
                t.importSpecifier(
                  t.identifier('lazy'),
                  t.identifier('lazy')
                ),
                t.importSpecifier(
                  t.identifier('Suspense'),
                  t.identifier('Suspense')
                )
              ],
              t.stringLiteral('react')
            );
            
            path.replaceWith(newImport);
            changes.push('next/dynamic import átalakítva React lazy és Suspense importra');
          }
        }
      },
      
      // Dynamic importok átalakítása React.lazy-re
      VariableDeclarator(path) {
        if (
          path.node.init && 
          t.isCallExpression(path.node.init) &&
          t.isIdentifier(path.node.init.callee) && 
          path.node.init.callee.name === 'dynamic'
        ) {
          // Ellenőrizzük, hogy a dynamic argumentuma egy függvény-e
          if (path.node.init.arguments.length > 0) {
            const dynamicArg = path.node.init.arguments[0];
            if (t.isArrowFunctionExpression(dynamicArg) || t.isFunctionExpression(dynamicArg)) {
              const dynamicBody = dynamicArg.body;
              
              // Ha a függvény teste egy import() hívás
              if (
                t.isCallExpression(dynamicBody) && 
                t.isImport(dynamicBody.callee)
              ) {
                // Létrehozzuk a lazy hívást
                const lazyCallExpr = t.callExpression(
                  t.identifier('lazy'),
                  [
                    t.arrowFunctionExpression(
                      [],
                      dynamicBody
                    )
                  ]
                );
                
                // Frissítjük az init mezőt a lazy hívással
                path.node.init = lazyCallExpr;
                changes.push('dynamic() hívás átalakítva lazy() hívásra');
              }
            }
          }
        }
      },
      
      // getServerSideProps, getStaticProps transzformálása
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          let fnName = '';
          
          if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
            fnName = path.node.declaration.id.name;
          } else if (
            t.isVariableDeclaration(path.node.declaration) &&
            path.node.declaration.declarations.length > 0 &&
            path.node.declaration.declarations[0].id &&
            t.isIdentifier(path.node.declaration.declarations[0].id)
          ) {
            fnName = path.node.declaration.declarations[0].id.name;
          }
          
          // SSR/SSG funkciónevek ellenőrzése
          if (['getServerSideProps', 'getStaticProps', 'getStaticPaths'].includes(fnName)) {
            // Átalakítjuk React Query kompatibilis hook-ká
            const reactQueryFnName = fnName === 'getServerSideProps' 
              ? 'useFetchData' 
              : (fnName === 'getStaticProps' ? 'useStaticData' : 'useAvailablePaths');
            
            // Új hook deklaráció létrehozása
            const hookDeclaration = t.functionDeclaration(
              t.identifier(reactQueryFnName),
              [],
              t.blockStatement([
                t.returnStatement(
                  t.callExpression(
                    t.identifier('useQuery'),
                    [
                      t.objectExpression([
                        t.objectProperty(
                          t.identifier('queryKey'),
                          t.arrayExpression([t.stringLiteral(fnName.toLowerCase())])
                        ),
                        t.objectProperty(
                          t.identifier('queryFn'),
                          t.arrowFunctionExpression(
                            [],
                            t.blockStatement([
                              t.commentStatement(' Original ' + fnName + ' logic '),
                              t.returnStatement(t.objectExpression([
                                t.objectProperty(
                                  t.identifier('props'),
                                  t.objectExpression([])
                                )
                              ]))
                            ])
                          )
                        )
                      ])
                    ]
                  )
                )
              ])
            );
            
            // Új export deklaráció létrehozása a hook-kal
            const exportHook = t.exportNamedDeclaration(hookDeclaration, []);
            
            // A régi export cseréje az újra
            path.replaceWith(exportHook);
            
            changes.push(`${fnName} átalakítva React Query ${reactQueryFnName} hook-ká`);
          }
        }
      },
      
      // Next.js komponensek transzformálása
      JSXElement(path) {
        const openingElement = path.node.openingElement;
        const closingElement = path.node.closingElement;
        const tagName = openingElement.name;
        
        if (t.isJSXIdentifier(tagName)) {
          // Next.js Image komponens átalakítása
          if (tagName.name === 'Image') {
            // Név ugyanaz marad (@unpic/react Image)
            
            // src és href attribútumok kezelése
            const newAttributes = openingElement.attributes.filter(attr => {
              if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                // Kihagyjuk a priority és placeholder attribútumokat
                if (['priority', 'placeholder'].includes(attr.name.name)) {
                  warnings.push(`Az Image komponens '${attr.name.name}' tulajdonsága nem támogatott az @unpic/react könyvtárban.`);
                  return false;
                }
              }
              return true;
            });
            
            // Layout attribútum ellenőrzése
            let hasLayout = false;
            for (const attr of newAttributes) {
              if (t.isJSXAttribute(attr) && 
                  t.isJSXIdentifier(attr.name) && 
                  attr.name.name === 'layout') {
                hasLayout = true;
                break;
              }
            }
            
            // Ha nincs layout, hozzáadunk egyet
            if (!hasLayout) {
              newAttributes.push(
                t.jsxAttribute(
                  t.jsxIdentifier('layout'),
                  t.stringLiteral('responsive')
                )
              );
            }
            
            // Frissítjük az attribútumokat
            openingElement.attributes = newAttributes;
            
            changes.push('Next.js Image komponens átalakítva @unpic/react Image komponensre');
          } 
          // Next.js Link komponens átalakítása
          else if (tagName.name === 'Link') {
            // Név ugyanaz marad (React Router Link neve is Link)
            
            // href attribútum átalakítása to attribútummá
            const newAttributes = openingElement.attributes.filter(attr => {
              if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                // Kihagyjuk a passHref és legacyBehavior attribútumokat
                if (['passHref', 'legacyBehavior'].includes(attr.name.name)) {
                  return false;
                }
                
                // href átalakítása to-ra
                if (attr.name.name === 'href') {
                  attr.name.name = 'to';
                }
              }
              return true;
            });
            
            // Frissítjük az attribútumokat
            openingElement.attributes = newAttributes;
            
            changes.push('Next.js Link komponens átalakítva React Router Link komponensre');
          }
          // Next.js Head komponens átalakítása
          else if (tagName.name === 'Head') {
            tagName.name = 'Helmet';
            
            if (closingElement && t.isJSXIdentifier(closingElement.name)) {
              closingElement.name.name = 'Helmet';
            }
            
            changes.push('Next.js Head komponens átalakítva react-helmet-async Helmet komponensre');
          }
          // Next.js Script komponens átalakítása
          else if (tagName.name === 'Script') {
            tagName.name = 'script';
            
            // strategy attribútum átalakítása
            const newAttributes = openingElement.attributes.filter(attr => {
              if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                if (attr.name.name === 'strategy') {
                  if (attr.value && t.isStringLiteral(attr.value) && attr.value.value === 'lazyOnload') {
                    // Helyette defer attribútumot használunk
                    openingElement.attributes.push(t.jsxAttribute(
                      t.jsxIdentifier('defer'),
                      t.jsxExpressionContainer(t.booleanLiteral(true))
                    ));
                  }
                  return false;
                }
              }
              return true;
            });
            
            // Frissítjük az attribútumokat
            openingElement.attributes = newAttributes;
            
            if (closingElement && t.isJSXIdentifier(closingElement.name)) {
              closingElement.name.name = 'script';
            }
            
            changes.push('Next.js Script komponens átalakítva standard script elemre');
          }
        }
      },
      
      // router használat átalakítása
      MemberExpression(path) {
        if (
          t.isIdentifier(path.node.object) &&
          path.node.object.name === 'router'
        ) {
          if (
            t.isIdentifier(path.node.property) &&
            path.node.property.name === 'push'
          ) {
            path.replaceWith(t.identifier('navigate'));
            changes.push('router.push átalakítva navigate függvényhívásra');
          } else if (
            t.isIdentifier(path.node.property) &&
            path.node.property.name === 'query'
          ) {
            path.replaceWith(t.identifier('params'));
            changes.push('router.query átalakítva params-ra');
          } else if (
            t.isIdentifier(path.node.property) &&
            (path.node.property.name === 'asPath' || path.node.property.name === 'pathname')
          ) {
            path.replaceWith(t.memberExpression(
              t.identifier('location'),
              t.identifier('pathname')
            ));
            changes.push('router.pathname/asPath átalakítva location.pathname-re');
          }
        }
      },
      
      // router.replace() átalakítása navigate(path, { replace: true })-ra
      CallExpression(path) {
        if (
          t.isMemberExpression(path.node.callee) &&
          t.isIdentifier(path.node.callee.object) &&
          path.node.callee.object.name === 'router' &&
          t.isIdentifier(path.node.callee.property) &&
          path.node.callee.property.name === 'replace' &&
          path.node.arguments.length > 0
        ) {
          // Átalakítjuk navigate() hívásra replace opcióval
          const newCall = t.callExpression(
            t.identifier('navigate'),
            [
              path.node.arguments[0],
              t.objectExpression([
                t.objectProperty(
                  t.identifier('replace'),
                  t.booleanLiteral(true)
                )
              ])
            ]
          );
          
          path.replaceWith(newCall);
          changes.push('router.replace() átalakítva navigate(path, { replace: true })-ra');
        }
        
        // router.back() átalakítása navigate(-1)-re
        if (
          t.isMemberExpression(path.node.callee) &&
          t.isIdentifier(path.node.callee.object) &&
          path.node.callee.object.name === 'router' &&
          t.isIdentifier(path.node.callee.property) &&
          path.node.callee.property.name === 'back'
        ) {
          const newCall = t.callExpression(
            t.identifier('navigate'),
            [t.numericLiteral(-1)]
          );
          
          path.replaceWith(newCall);
          changes.push('router.back() átalakítva navigate(-1)-re');
        }
        
        // useRouter() átalakítása a három React Router hook-ra
        if (
          t.isIdentifier(path.node.callee) &&
          path.node.callee.name === 'useRouter'
        ) {
          // Ha ez egy változó deklarációban van, akkor különleges kezelés kell
          if (
            path.parent && 
            t.isVariableDeclarator(path.parent) && 
            t.isIdentifier(path.parent.id) &&
            path.parent.id.name === 'router'
          ) {
            // Meg kell keresni a változó deklaráció szülőjét
            const varDeclPath = path.findParent(p => t.isVariableDeclaration(p));
            
            if (varDeclPath) {
              // Új hook-ok létrehozása
              const navigateHook = t.variableDeclaration(
                'const',
                [
                  t.variableDeclarator(
                    t.identifier('navigate'),
                    t.callExpression(
                      t.identifier('useNavigate'),
                      []
                    )
                  )
                ]
              );
              
              const paramsHook = t.variableDeclaration(
                'const',
                [
                  t.variableDeclarator(
                    t.identifier('params'),
                    t.callExpression(
                      t.identifier('useParams'),
                      []
                    )
                  )
                ]
              );
              
              const locationHook = t.variableDeclaration(
                'const',
                [
                  t.variableDeclarator(
                    t.identifier('location'),
                    t.callExpression(
                      t.identifier('useLocation'),
                      []
                    )
                  )
                ]
              );
              
              // A program törzsében cseréljük a hook hívást
              const program = path.findParent(p => t.isProgram(p));
              if (program && program.node.body) {
                // Megkeressük a változó deklaráció indexét
                const declarations = program.node.body;
                for (let i = 0; i < declarations.length; i++) {
                  if (declarations[i] === varDeclPath.node) {
                    // Beszúrjuk az új hook-okat
                    declarations.splice(i, 1, navigateHook, paramsHook, locationHook);
                    break;
                  }
                }
              }
              
              changes.push('useRouter() hook átalakítva useNavigate, useParams és useLocation hook-okra');
            }
          }
        }
      }
    });
    
    // Generáljuk a transzformált kódot
    const output = generate(ast, {
      comments: opts.preserveComments,
      compact: false,
      jsescOption: {
        minimal: true
      }
    });
    
    return {
      code: output.code,
      warnings,
      changes
    };
    
  } catch (error) {
    console.error('AST transzformációs hiba:', error);
    warnings.push(`AST transzformációs hiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
    
    return {
      code: sourceCode,
      warnings,
      changes: []
    };
  }
}

/**
 * AST transzformációs API exportálása
 */
export const AstTransformer = {
  transform: transformWithAst,
  
  // Segédfüggvények különböző típusú konverziókra
  transformNextImage: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformNextLink: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformNextRouter: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformNextHead: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformGetServerSideProps: (code: string) => transformWithAst(code, { preserveComments: true }),
};

/**
 * AST elemző segédfüggvények a kód struktúra mélyebb vizsgálatához
 */
export function analyzeCodeStructure(code: string): {
  imports: string[];
  exports: string[];
  components: string[];
  hooks: string[];
  hasNextImports: boolean;
  hasApiRoutes: boolean;
} {
  const imports: string[] = [];
  const exports: string[] = [];
  const components: string[] = [];
  const hooks: string[] = [];
  let hasNextImports = false;
  let hasApiRoutes = false;
  
  try {
    // AST elemzés
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'] as parser.ParserPlugin[],
    });
    
    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value as string;
        imports.push(source);
        
        // Next.js importok detektálása
        if (source.startsWith('next/')) {
          hasNextImports = true;
        }
      },
      
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
            exports.push(path.node.declaration.id.name);
            
            // Next.js API route-ok detektálása
            if (path.node.declaration.id.name === 'handler') {
              hasApiRoutes = true;
            }
          } else if (t.isVariableDeclaration(path.node.declaration)) {
            path.node.declaration.declarations.forEach(decl => {
              if (t.isIdentifier(decl.id)) {
                exports.push(decl.id.name);
                
                // SSR/SSG funkciók detektálása
                if (['getServerSideProps', 'getStaticProps', 'getStaticPaths'].includes(decl.id.name)) {
                  hasApiRoutes = true;
                }
              }
            });
          }
        }
      },
      
      ExportDefaultDeclaration(path) {
        if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
          exports.push(path.node.declaration.id.name);
          
          // Next.js API route-ok detektálása
          if (path.node.declaration.id.name === 'handler') {
            hasApiRoutes = true;
          }
        } else if (t.isIdentifier(path.node.declaration)) {
          exports.push(path.node.declaration.name);
        }
      },
      
      // React komponensek detektálása
      VariableDeclarator(path) {
        if (t.isIdentifier(path.node.id)) {
          const name = path.node.id.name;
          
          // Ha nagybetűvel kezdődik, valószínűleg komponens
          if (name[0] === name[0].toUpperCase()) {
            // Ellenőrizzük, hogy JSX vagy függvény-e, ami JSX-et ad vissza
            let isComponent = false;
            
            if (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init)) {
              // Ellenőrizzük a függvény testét JSX elemek után
              traverse.default(
                t.arrowFunctionExpression(
                  path.node.init.params,
                  path.node.init.body,
                  path.node.init.async
                ),
                {
                  JSXElement() {
                    isComponent = true;
                    // Leállítjuk a bejárást, ha megtaláltuk a JSX-et
                    path.stop();
                  }
                },
                path.scope,
                path
              );
            }
            
            if (isComponent) {
              components.push(name);
            }
          }
          
          // Hook-ok detektálása (use prefixű függvények)
          if (name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()) {
            hooks.push(name);
          }
        }
      },
      
      // Függvény deklarációk kezelése (komponensek és hook-ok)
      FunctionDeclaration(path) {
        if (path.node.id) {
          const name = path.node.id.name;
          
          // Komponensek (nagybetűvel kezdődő nevek)
          if (name[0] === name[0].toUpperCase()) {
            // Ellenőrizz��k a függvény testét JSX elemek után
            let hasJsx = false;
            traverse.default(
              path.node,
              {
                JSXElement() {
                  hasJsx = true;
                  // Leállítjuk a bejárást, ha megtaláltuk a JSX-et
                  path.stop();
                }
              },
              path.scope,
              path
            );
            
            if (hasJsx) {
              components.push(name);
            }
          }
          
          // Hook-ok (use prefixű függvények)
          if (name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()) {
            hooks.push(name);
          }
        }
      }
    });
    
    return {
      imports,
      exports,
      components,
      hooks,
      hasNextImports,
      hasApiRoutes
    };
    
  } catch (error) {
    console.error('Kód struktúra elemzési hiba:', error);
    return {
      imports: [],
      exports: [],
      components: [],
      hooks: [],
      hasNextImports: false,
      hasApiRoutes: false
    };
  }
}

/**
 * Optimalizált kód transzformáció komplex Next.js komponensek esetén
 */
export function transformPageComponent(code: string): {
  code: string;
  warnings: string[];
  changes: string[];
  addedImports: string[];
} {
  // Alap transzformáció elvégzése
  const { code: transformedCode, warnings, changes } = transformWithAst(code);
  
  // Kód struktúra elemzése
  const codeStructure = analyzeCodeStructure(transformedCode);
  
  const addedImports: string[] = [];
  
  // React Query import hozzáadása, ha szükséges
  if (
    changes.some(change => change.includes('React Query')) &&
    !codeStructure.imports.includes('@tanstack/react-query')
  ) {
    addedImports.push('import { useQuery } from "@tanstack/react-query";');
  }
  
  // React Router importok hozzáadása, ha szükséges
  if (
    changes.some(change => change.includes('React Router')) &&
    !codeStructure.imports.includes('react-router-dom')
  ) {
    addedImports.push('import { useNavigate, useParams, useLocation } from "react-router-dom";');
  }
  
  // @unpic/react import hozzáadása, ha szükséges
  if (
    changes.some(change => change.includes('@unpic/react')) &&
    !codeStructure.imports.includes('@unpic/react')
  ) {
    addedImports.push('import { Image } from "@unpic/react";');
  }
  
  // react-helmet-async import hozzáadása, ha szükséges
  if (
    changes.some(change => change.includes('react-helmet-async')) &&
    !codeStructure.imports.includes('react-helmet-async')
  ) {
    addedImports.push('import { Helmet } from "react-helmet-async";');
  }
  
  // React Suspense import hozzáadása, ha szükséges
  if (
    changes.some(change => change.includes('React lazy')) &&
    !codeStructure.imports.includes('react')
  ) {
    addedImports.push('import { lazy, Suspense } from "react";');
  }
  
  // Importok hozzáadása a transzformált kódhoz
  const result = addedImports.join('\n') + '\n\n' + transformedCode;
  
  return {
    code: result,
    warnings,
    changes,
    addedImports
  };
}
