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
        detectionKeywords: ['typescript', 'ts', 'interface', 'type', 'enum'],
        fileExtensions: ['ts', 'tsx'],
        testFilePatterns: ['*.test.ts', '*.spec.ts'],
        executionCommand: (filePath: string) => `npx ts-node "${filePath}"`,
        isExecutable: true
    },
    {
        name: 'JavaScript',
        detectionKeywords: ['javascript', 'js', 'node', 'npm'],
        fileExtensions: ['js', 'jsx', 'mjs'],
        testFilePatterns: ['*.test.js', '*.spec.js'],
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
        name: 'Vue.js',
        detectionKeywords: ['vue', 'vue.js', 'vuejs', 'component', 'reactive'],
        fileExtensions: ['vue'],
        testFilePatterns: ['*.test.vue', '*.spec.vue'],
        executionCommand: (filePath: string) => `npm run dev`,
        isExecutable: false
    },
    {
        name: 'Angular',
        detectionKeywords: ['angular', 'ng', '@angular', 'component', 'service'],
        fileExtensions: ['ts', 'html', 'scss'],
        testFilePatterns: ['*.spec.ts'],
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
        name: 'Kotlin',
        detectionKeywords: ['kotlin', 'android', 'kt'],
        fileExtensions: ['kt', 'kts'],
        testFilePatterns: ['*Test.kt', '*Tests.kt'],
        executionCommand: (filePath: string) => `kotlinc "${filePath}" -include-runtime -d "${filePath.replace('.kt', '.jar')}" && java -jar "${filePath.replace('.kt', '.jar')}"`,
        isExecutable: true
    },

    // Scripting
    {
        name: 'Bash',
        detectionKeywords: ['bash', 'shell', 'sh', 'script'],
        fileExtensions: ['sh', 'bash'],
        testFilePatterns: ['*_test.sh', '*Test.sh'],
        executionCommand: (filePath: string) => `bash "${filePath}"`,
        isExecutable: true
    }
];
