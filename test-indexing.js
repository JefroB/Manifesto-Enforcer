/**
 * Test file to demonstrate codebase indexing functionality
 * This file will be indexed by the Manifesto Enforcer extension
 */

// Test function for indexing
function testFunction(param1, param2) {
    try {
        if (!param1 || !param2) {
            throw new Error('Invalid parameters');
        }
        
        return param1 + param2;
    } catch (error) {
        console.error('Error in testFunction:', error);
        return null;
    }
}

// Test class for indexing
class TestClass {
    constructor(name) {
        this.name = name;
    }
    
    getName() {
        return this.name;
    }
    
    setName(newName) {
        if (!newName || typeof newName !== 'string') {
            throw new Error('Invalid name parameter');
        }
        this.name = newName;
    }
}

// Test interface (TypeScript-style comment)
/**
 * @interface TestInterface
 * @property {string} id - Unique identifier
 * @property {string} value - The value
 */

// Export for module usage
module.exports = {
    testFunction,
    TestClass
};

console.log('Test file loaded - ready for indexing!');
