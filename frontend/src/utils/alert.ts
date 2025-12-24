import { showSuccessToast, showErrorToast } from '../components/ui/ToastContainer';

/**
 * Affiche une notification de succès
 */
export const showSuccessAlert = (message: string) => {
  showSuccessToast(message);
};

/**
 * Affiche une notification d'erreur
 */
export const showErrorAlert = (message: string) => {
  showErrorToast(message);
};

/**
 * Extrait le message d'erreur depuis une erreur API
 * Retourne uniquement le message utilisateur, sans détails techniques
 */
export const getErrorMessage = (error: any): string => {
  // Priorité 1: Message depuis la réponse API (backend)
  if (error?.response?.data?.message) {
    const message = error.response.data.message;
    
    // Si le message contient des détails techniques, extraire uniquement la partie utilisateur
    if (message.includes('Invalid `prisma.') || message.includes('invocation in')) {
      // Chercher un message d'erreur personnalisé dans les lignes
      const lines = message.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        // Chercher des messages d'erreur personnalisés
        if (trimmedLine.includes('Un patient avec') || 
            trimmedLine.includes('Un utilisateur avec') ||
            trimmedLine.includes('existe déjà') ||
            trimmedLine.includes('non trouvé') ||
            trimmedLine.includes('Champs obligatoires') ||
            trimmedLine.includes('requis')) {
          // Extraire uniquement la partie entre guillemets ou après "throw new AppError"
          const match = trimmedLine.match(/['"]([^'"]+)['"]/);
          if (match && match[1]) {
            return match[1];
          }
          // Sinon, retourner la ligne si elle contient un message clair
          if (trimmedLine.length < 200) {
            return trimmedLine;
          }
        }
      }
      
      // Si c'est une erreur de contrainte unique, formater un message clair
      if (message.includes('Unique constraint failed')) {
        if (message.includes('telephone')) {
          return 'Un patient avec ce numéro de téléphone existe déjà';
        }
        if (message.includes('numeroSS')) {
          return 'Un patient avec ce numéro de sécurité sociale existe déjà';
        }
        if (message.includes('email')) {
          return 'Un utilisateur avec cet email existe déjà';
        }
        if (message.includes('numeroOrdre')) {
          return 'Un utilisateur avec ce numéro d\'ordre existe déjà';
        }
        return 'Cette valeur existe déjà dans le système';
      }
      
      // Message générique si on ne peut pas extraire de message clair
      return 'Une erreur est survenue lors de l\'opération';
    }
    
    // Retourner le message tel quel s'il n'y a pas de détails techniques
    return message;
  }
  
  // Priorité 2: Message depuis l'erreur elle-même
  if (error?.message) {
    // Ignorer les messages techniques
    if (error.message.includes('Invalid `prisma.') || 
        error.message.includes('Unique constraint') ||
        error.message.includes('invocation in')) {
      return 'Une erreur est survenue lors de l\'opération';
    }
    return error.message;
  }
  
  // Message par défaut
  return 'Une erreur est survenue';
};
