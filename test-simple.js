// Test simplifié - copiez/collez dans la console

// 1. Vérifier currentProject
console.log('currentProject:', currentProject);

// 2. Vérifier les activités
console.log('activities:', activities);

// 3. Test manuel de chargement
(async () => {
    if (currentProject) {
        console.log('=== Test chargement activités ===');
        const { data, error } = await supabaseClient
            .from('activities')
            .select('*')
            .eq('project_id', currentProject);

        console.log('data:', data);
        console.log('error:', error);
    } else {
        console.log('Aucun projet sélectionné');
    }
})();
