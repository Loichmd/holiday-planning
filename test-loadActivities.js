// Test de loadActivities - copiez/collez dans la console

(async () => {
    console.log('=== Test loadActivities ===');
    console.log('Avant - activities:', activities.length);

    const result = await loadActivities(currentProject);

    console.log('Résultat:', result);
    console.log('Après - activities:', activities.length);
    console.log('activities:', activities);

    // Re-render le calendrier
    renderCalendar();
    console.log('Calendrier re-rendu');
})();
