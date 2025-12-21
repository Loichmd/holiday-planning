// Test de selectProject - copiez/collez dans la console

// Vérifier si selectProject est async
console.log('selectProject est async?', selectProject.constructor.name === 'AsyncFunction');

// Afficher le code de selectProject
console.log('Code de selectProject:');
console.log(selectProject.toString());
