// Función para encontrar el número que aparece un número impar de veces
function findOddOccurrence(arr) {
    // Utilizamos el operador XOR (^) para encontrar el número
    // XOR de un número consigo mismo es 0
    // XOR de un número con 0 es el número mismo
    // Por lo tanto, los números que aparecen un número par de veces se cancelarán
    return arr.reduce((a, b) => a ^ b);
}

// Casos de prueba
const testCases = [
    [7],                    // Resultado esperado: 7
    [0],                    // Resultado esperado: 0
    [1,1,2],               // Resultado esperado: 2
    [0,1,0,1,0],           // Resultado esperado: 0
    [1,2,2,3,3,3,4,3,3,3,2,2,1], // Resultado esperado: 4
];

// Ejecutar los casos de prueba
testCases.forEach((testCase, index) => {
    const result = findOddOccurrence(testCase);
    console.log(`Caso de prueba ${index + 1}:`);
    console.log(`Array: [${testCase}]`);
    console.log(`Resultado: ${result}\n`);
});