/**
 * Centralized Language Configuration
 * This file defines all supported programming languages and their properties
 */

export interface LanguageConfig {
    name: string;
    detectionKeywords: string[];
    fileExtensions: string[];
    testFilePatterns: string[];
    executionCommand: (filePath: string) => string;
    isExecutable: boolean;
}

export const languageConfigurations: LanguageConfig[] = [
    // Existing Languages
    {
        name: 'TypeScript',
        detectionKeywords: ['typescript', 'typescript manifesto', 'ts manifesto', 'interface', 'type', 'enum', 'webdriverio', 'wdio'],
        fileExtensions: ['ts', 'tsx'],
        testFilePatterns: ['*.test.ts', '*.spec.ts', '*.wdio.ts', '**/*.wdio.ts', 'test/specs/**/*.ts', 'e2e/**/*.ts'],
        executionCommand: (filePath: string) => `npx ts-node "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'JavaScript',
        detectionKeywords: ['javascript', 'js', 'node', 'npm', 'webdriverio', 'wdio'],
        fileExtensions: ['js', 'jsx', 'mjs'],
        testFilePatterns: ['*.test.js', '*.spec.js', '*.wdio.js', '**/*.wdio.js', 'test/specs/**/*.js', 'e2e/**/*.js'],
        executionCommand: (filePath: string) => `node "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'Python',
        detectionKeywords: ['python', 'py', 'pandas', 'numpy', 'django', 'flask'],
        fileExtensions: ['py', 'pyw'],
        testFilePatterns: ['test_*.py', '*_test.py'],
        executionCommand: (filePath: string) => `python "${filePath}"`,
        isExecutable: true
    },

    // Web Frontend
    {
        name: 'React',
        detectionKeywords: ['react', 'jsx', 'react component', 'hooks', 'useState', 'useEffect'],
        fileExtensions: ['jsx', 'tsx'],
        testFilePatterns: ['*.test.jsx', '*.spec.jsx', '*.test.tsx', '*.spec.tsx', '*.wdio.jsx', '*.wdio.tsx', 'src/**/*.wdio.js', 'src/**/*.wdio.ts'],
        executionCommand: (filePath: string) => `npm start`,
        isExecutable: false
    },
    {
        name: 'Vue.js',
        detectionKeywords: ['vue', 'vue.js', 'vuejs', 'component', 'reactive', 'webdriverio', 'wdio'],
        fileExtensions: ['vue'],
        testFilePatterns: ['*.test.vue', '*.spec.vue', '*.wdio.vue', 'tests/e2e/**/*.js', 'tests/e2e/**/*.ts'],
        executionCommand: (filePath: string) => `npm run dev`,
        isExecutable: false
    },
    {
        name: 'Angular',
        detectionKeywords: ['angular', 'ng', '@angular', 'component', 'service', 'webdriverio', 'wdio'],
        fileExtensions: ['ts', 'html', 'scss'],
        testFilePatterns: ['*.spec.ts', '*.wdio.ts', 'e2e/**/*.wdio.ts', 'src/app/**/*.wdio.ts'],
        executionCommand: (filePath: string) => `ng serve`,
        isExecutable: false
    },
    {
        name: 'Svelte',
        detectionKeywords: ['svelte', 'sveltekit', '$:'],
        fileExtensions: ['svelte'],
        testFilePatterns: ['*.test.svelte', '*.spec.svelte'],
        executionCommand: (filePath: string) => `npm run dev`,
        isExecutable: false
    },

    // Web Backend
    {
        name: 'Ruby',
        detectionKeywords: ['ruby', 'rb', 'rails', 'gem', 'bundler'],
        fileExtensions: ['rb', 'rbw'],
        testFilePatterns: ['*_test.rb', '*_spec.rb'],
        executionCommand: (filePath: string) => `ruby "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'PHP',
        detectionKeywords: ['php', 'laravel', 'symfony', 'composer'],
        fileExtensions: ['php', 'phtml'],
        testFilePatterns: ['*Test.php', '*_test.php'],
        executionCommand: (filePath: string) => `php "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'Go',
        detectionKeywords: ['go', 'golang', 'goroutine', 'channel'],
        fileExtensions: ['go'],
        testFilePatterns: ['*_test.go'],
        executionCommand: (filePath: string) => `go run "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'Java',
        detectionKeywords: ['java', 'spring', 'maven', 'gradle', 'class'],
        fileExtensions: ['java'],
        testFilePatterns: ['*Test.java', '*Tests.java'],
        executionCommand: (filePath: string) => `javac "${filePath}" && java "${filePath.replace('.java', '')}"`,
        isExecutable: true
    },
    {
        name: 'C#',
        detectionKeywords: ['c#', 'csharp', '.net', 'dotnet', 'namespace'],
        fileExtensions: ['cs'],
        testFilePatterns: ['*Test.cs', '*Tests.cs'],
        executionCommand: (filePath: string) => `dotnet run "${filePath}"`,
        isExecutable: true
    },

    // Systems/General Purpose
    {
        name: 'C++',
        detectionKeywords: ['c++', 'cpp', 'class', 'inheritance', 'template'],
        fileExtensions: ['cpp', 'cxx', 'cc', 'h', 'hpp'],
        testFilePatterns: ['*_test.cpp', '*Test.cpp'],
        executionCommand: (filePath: string) => `g++ "${filePath}" -o "${filePath.replace(/\.(cpp|cxx|cc)$/, '')}" && ./"${filePath.replace(/\.(cpp|cxx|cc)$/, '')}"`,
        isExecutable: true
    },
    {
        name: 'C',
        detectionKeywords: ['c language', 'clang', 'gcc', 'stdio'],
        fileExtensions: ['c', 'h'],
        testFilePatterns: ['*_test.c', '*Test.c'],
        executionCommand: (filePath: string) => `gcc "${filePath}" -o "${filePath.replace('.c', '')}" && ./"${filePath.replace('.c', '')}"`,
        isExecutable: true
    },
    {
        name: 'Rust',
        detectionKeywords: ['rust', 'cargo', 'rustc', 'trait', 'impl'],
        fileExtensions: ['rs'],
        testFilePatterns: ['*_test.rs', '*Test.rs'],
        executionCommand: (filePath: string) => `rustc "${filePath}" && ./"${filePath.replace('.rs', '')}"`,
        isExecutable: true
    },

    // Mobile
    {
        name: 'Swift',
        detectionKeywords: ['swift', 'ios', 'xcode', 'cocoa'],
        fileExtensions: ['swift'],
        testFilePatterns: ['*Test.swift', '*Tests.swift'],
        executionCommand: (filePath: string) => `swift "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'Flutter',
        detectionKeywords: ['flutter', 'dart', 'widget', 'statefulwidget', 'statelesswidget', 'material', 'cupertino', 'scaffold', 'appbar'],
        fileExtensions: ['dart'],
        testFilePatterns: ['*_test.dart', 'test/*.dart', 'integration_test/*.dart'],
        executionCommand: (filePath: string) => `flutter run`,
        isExecutable: true
    },
    {
        name: 'Dart',
        detectionKeywords: ['dart', 'pub', 'pubspec', 'main()', 'void main'],
        fileExtensions: ['dart'],
        testFilePatterns: ['*_test.dart', 'test/*.dart'],
        executionCommand: (filePath: string) => `dart "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'Kotlin',
        detectionKeywords: ['kotlin', 'android', 'kt'],
        fileExtensions: ['kt', 'kts'],
        testFilePatterns: ['*Test.kt', '*Tests.kt'],
        executionCommand: (filePath: string) => `kotlinc "${filePath}" -include-runtime -d "${filePath.replace('.kt', '.jar')}" && java -jar "${filePath.replace('.kt', '.jar')}"`,
        isExecutable: true
    },

    // Data Science & Analytics
    {
        name: 'R',
        detectionKeywords: ['r language', 'rstudio', 'cran', 'ggplot', 'dplyr', 'tidyverse'],
        fileExtensions: ['r', 'R', 'rmd'],
        testFilePatterns: ['test_*.R', '*_test.R'],
        executionCommand: (filePath: string) => `Rscript "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'MATLAB',
        detectionKeywords: ['matlab', 'simulink', 'matrix', 'octave'],
        fileExtensions: ['m', 'mlx'],
        testFilePatterns: ['test_*.m', '*Test.m'],
        executionCommand: (filePath: string) => `matlab -batch "run('${filePath}')"`,
        isExecutable: true
    },
    {
        name: 'Julia',
        detectionKeywords: ['julia', 'julialang', 'pkg', 'using'],
        fileExtensions: ['jl'],
        testFilePatterns: ['test_*.jl', '*_test.jl'],
        executionCommand: (filePath: string) => `julia "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'Scala',
        detectionKeywords: ['scala', 'sbt', 'spark', 'akka', 'play'],
        fileExtensions: ['scala', 'sc'],
        testFilePatterns: ['*Test.scala', '*Spec.scala'],
        executionCommand: (filePath: string) => `scala "${filePath}"`,
        isExecutable: true
    },

    // Functional Programming
    {
        name: 'Haskell',
        detectionKeywords: ['haskell', 'ghc', 'cabal', 'stack', 'monad'],
        fileExtensions: ['hs', 'lhs'],
        testFilePatterns: ['*Test.hs', '*Spec.hs'],
        executionCommand: (filePath: string) => `runhaskell "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'F#',
        detectionKeywords: ['f#', 'fsharp', 'dotnet', 'functional'],
        fileExtensions: ['fs', 'fsx', 'fsi'],
        testFilePatterns: ['*Test.fs', '*Tests.fs'],
        executionCommand: (filePath: string) => `dotnet fsi "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'Clojure',
        detectionKeywords: ['clojure', 'leiningen', 'clj', 'defn', 'lisp'],
        fileExtensions: ['clj', 'cljs', 'cljc'],
        testFilePatterns: ['*_test.clj', 'test_*.clj'],
        executionCommand: (filePath: string) => `clojure "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'Elixir',
        detectionKeywords: ['elixir', 'phoenix', 'mix', 'otp', 'erlang'],
        fileExtensions: ['ex', 'exs'],
        testFilePatterns: ['*_test.exs', 'test_*.exs'],
        executionCommand: (filePath: string) => `elixir "${filePath}"`,
        isExecutable: true
    },

    // Web & Markup
    {
        name: 'HTML',
        detectionKeywords: ['html', 'html5', 'dom', 'web', 'markup'],
        fileExtensions: ['html', 'htm'],
        testFilePatterns: ['*.test.html', '*Test.html'],
        executionCommand: (filePath: string) => `open "${filePath}"`,
        isExecutable: false
    },
    {
        name: 'CSS',
        detectionKeywords: ['css', 'stylesheet', 'flexbox', 'grid', 'responsive'],
        fileExtensions: ['css'],
        testFilePatterns: ['*.test.css', '*Test.css'],
        executionCommand: (filePath: string) => `open "${filePath}"`,
        isExecutable: false
    },
    {
        name: 'SCSS',
        detectionKeywords: ['scss', 'sass', 'mixin', 'variable', 'nesting'],
        fileExtensions: ['scss', 'sass'],
        testFilePatterns: ['*.test.scss', '*Test.scss'],
        executionCommand: (filePath: string) => `sass "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'SQL',
        detectionKeywords: ['sql', 'database', 'select', 'insert', 'update', 'delete', 'mysql', 'postgresql'],
        fileExtensions: ['sql'],
        testFilePatterns: ['*_test.sql', 'test_*.sql'],
        executionCommand: (filePath: string) => `mysql < "${filePath}"`,
        isExecutable: true
    },

    // Scripting & Automation
    {
        name: 'PowerShell',
        detectionKeywords: ['powershell', 'ps1', 'cmdlet', 'pipeline', 'windows'],
        fileExtensions: ['ps1', 'psm1', 'psd1'],
        testFilePatterns: ['*.Tests.ps1', '*Test.ps1'],
        executionCommand: (filePath: string) => `powershell -File "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'Perl',
        detectionKeywords: ['perl', 'cpan', 'regex', 'text processing'],
        fileExtensions: ['pl', 'pm', 'perl'],
        testFilePatterns: ['*.t', '*_test.pl'],
        executionCommand: (filePath: string) => `perl "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'Lua',
        detectionKeywords: ['lua', 'luarocks', 'embedded', 'scripting'],
        fileExtensions: ['lua'],
        testFilePatterns: ['*_test.lua', 'test_*.lua'],
        executionCommand: (filePath: string) => `lua "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'Bash',
        detectionKeywords: ['bash', 'shell', 'sh', 'script'],
        fileExtensions: ['sh', 'bash'],
        testFilePatterns: ['*_test.sh', '*Test.sh'],
        executionCommand: (filePath: string) => `bash "${filePath}"`,
        isExecutable: true
    }
];
