import ingredientEmojisData from '../ingredientEmojis.json';

// Type pour le JSON d'emojis
type IngredientEmojisData = Record<string, Record<string, string>>;

// Fonction pour obtenir l'emoji d'un ingrédient
export function getIngredientEmoji(ingredientName: string): string {
    const name = ingredientName.toLowerCase().trim();

    // Chercher dans toutes les catégories du JSON
    const emojis = ingredientEmojisData as IngredientEmojisData;

    for (const category of Object.values(emojis)) {
        // Recherche exacte d'abord
        if (category[name]) {
            return category[name];
        }
    }

    // Recherche par inclusion (pour gérer les variations)
    // On parcourt du plus spécifique au plus général
    const allIngredients = Object.entries(emojis).flatMap(([_, ingredients]) =>
        Object.entries(ingredients)
    );

    // Trier par longueur décroissante pour matcher les termes les plus spécifiques d'abord
    allIngredients.sort((a, b) => b[0].length - a[0].length);

    for (const [ingredient, emoji] of allIngredients) {
        if (name.includes(ingredient)) {
            return emoji;
        }
    }

    // Emoji par défaut si aucune correspondance trouvée
    return '🥘';
}
