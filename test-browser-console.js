// ============================================
// TEST: À exécuter dans la console du navigateur
// ============================================
// Copiez/collez ces commandes une par une dans la console
// pendant que vous êtes connecté en tant que COLLABORATEUR

// 1. Vérifier l'utilisateur actuel
console.log('=== Utilisateur actuel ===');
console.log('currentUser:', currentUser);

// 2. Vérifier les projets chargés
console.log('=== Projets chargés ===');
console.log('projects:', projects);

// 3. Vérifier le projet actuel
console.log('=== Projet actuel ===');
console.log('currentProject:', currentProject);

// 4. Vérifier les activités chargées
console.log('=== Activités chargées ===');
console.log('activities:', activities);

// 5. Tester le chargement des activités manuellement
// Remplacez PROJECT_ID par l'ID du projet partagé
(async () => {
    const projectId = currentProject?.id; // ou mettez l'ID directement
    console.log('=== Test chargement activités pour projet:', projectId, '===');

    const { data, error } = await supabaseClient
        .from('activities')
        .select('*')
        .eq('project_id', projectId);

    console.log('Résultat:', { data, error });
})();

// 6. Tester la fonction get_all_user_projects
(async () => {
    console.log('=== Test get_all_user_projects ===');
    const { data, error } = await supabaseClient.rpc('get_all_user_projects');
    console.log('Résultat:', { data, error });
})();
