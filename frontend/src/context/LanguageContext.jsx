import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const LanguageContext = createContext();

const supportedLanguages = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'ar', label: 'العربية (مصر)' },
];

const localeMap = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-EG',
};

const directionMap = {
  ar: 'rtl',
};

const getStoredLanguage = () => {
  if (typeof window === 'undefined') {
    return 'es';
  }
  const [firstSegment] = window.location.pathname.split('/').filter(Boolean);
  if (firstSegment && supportedLanguages.some((lang) => lang.id === firstSegment)) {
    return firstSegment;
  }

  const stored = localStorage.getItem('language');
  if (stored && supportedLanguages.some((lang) => lang.id === stored)) {
    return stored;
  }

  const browserLanguage = window.navigator?.language?.toLowerCase();
  if (browserLanguage) {
    const match = supportedLanguages.find(
      (lang) =>
        lang.id === browserLanguage || browserLanguage.startsWith(`${lang.id}-`)
    );
    if (match) {
      return match.id;
    }
  }

  return 'es';
};

const translations = {
  es: {
    headerTitle: 'Mi Jardín Mental',
    navGarden: 'Jardín',
    navHistory: 'Historial',
    navCommunity: 'Comunidad',
    navLogout: 'Cerrar sesión',
    languageLabel: 'Idioma',

    authWelcomeTitle: 'Bienvenido a Mi Jardín Mental',
    authCreateAccountTitle: 'Crear una cuenta',
    authIntro:
      'Registra las vivencias buenas y malas de tu día, clasifícalas por categoría y observa cómo evoluciona la planta que representa tu bienestar.',
    authUsernameLabel: 'Nombre de usuario',
    authEmailLabel: 'Email',
    authPasswordLabel: 'Contraseña',
    authProcessing: 'Procesando...',
    authLoginButton: 'Iniciar sesión',
    authRegisterButton: 'Registrarme',
    authNoAccount: '¿No tienes cuenta?',
    authHaveAccount: '¿Ya tienes cuenta?',
    authRegisterLink: 'Regístrate',
    authLoginLink: 'Inicia sesión',
    authDemoTitle: '¿Quieres explorar rápidamente?',
    authDemoText:
      'Usa el usuario de demostración {email} con la contraseña {password} para ver un jardín con eventos registrados.',
    authDemoButton: 'Autocompletar credenciales de prueba',

    gardenLoading: 'Cargando tu jardín...',
    gardenHealth: 'Salud del jardín: {health}%',
    gardenMoodNeedsCare: 'Tu jardín necesita cuidados.',
    gardenMoodBalanced: 'Tu jardín está en equilibrio.',
    gardenMoodFlourishing: '¡Tu jardín florece con fuerza!',
    gardenMoodDescription:
      'Cada emoción que registres representa un riego o una sequía para tu planta interior. Usa las categorías para detectar patrones y equilibrar tu día a día.',
    gardenRecordEvent: 'Registrar evento emocional',
    gardenEditButton: 'Editar',
    gardenDeleteButton: 'Eliminar',
    gardenNoCategory: 'Sin categoría',
    gardenTypePositive: 'Positivo',
    gardenTypeNegative: 'Negativo',
    gardenTypeNeutral: 'Neutro',
    gardenNoDescription: 'Sin descripción',
    gardenNoEvents:
      'Aún no tienes eventos registrados. Cada emoción que registres nutrirá o agotará tu planta según cómo te haya impactado.',
    gardenFormTitle: 'Registrar emoción',
    gardenFormDescription:
      'Describe lo que sucedió, clasifícalo y cuéntanos cómo impactó tu día. Así veremos crecer o decaer el jardín.',
    gardenFormName: 'Nombre',
    gardenFormCategory: 'Categoría',
    gardenFormCategoryPlaceholder: 'Ej. Trabajo, Relaciones, Autocuidado',
    gardenFormType: 'Tipo',
    gardenFormDescriptionLabel: 'Descripción',
    gardenFormDescriptionPlaceholder: 'Describe qué sucedió o cómo te sentiste',
    gardenFormCancel: 'Cancelar',
    gardenFormSave: 'Guardar',
    gardenFormSaving: 'Guardando...',
    gardenEditTitle: 'Actualizar descripción',
    gardenEditCancel: 'Cancelar',
    gardenEditUpdate: 'Actualizar',

    historyTitle: 'Historial de emociones',
    historySubtitle: 'Explora cómo ha evolucionado tu jardín mental.',
    historyRange7: 'Últimos 7 días',
    historyRange30: 'Últimos 30 días',
    historyRangeAll: 'Todo el historial',
    historyLoading: 'Cargando historial...',
    historyError: 'No se pudo cargar el historial.',
    historyNoCategory: 'Sin categoría',
    historyNoDescription: 'Sin descripción',
    historyEmptyRange: 'No hay eventos registrados en este periodo.',

    communitySearchTitle: 'Buscar comunidad',
    communitySearchSubtitle:
      'Encuentra a otros jardineros emocionales por su nombre de usuario y agrégalos como amigos.',
    communitySearchPlaceholder: 'Buscar por nombre de usuario',
    communitySearchButton: 'Buscar',
    communitySearching: 'Buscando...',
    communitySearchMinChars: 'Escribe al menos 2 caracteres para buscar.',
    communitySearchError: 'No se pudo realizar la búsqueda.',
    communityFriendAdded: '{name} ahora forma parte de tu jardín social.',
    communityFriendAddedGeneric: 'Se agregó el nuevo amigo correctamente.',
    communityAlreadyFriend: 'Ya es parte de tus amigos',
    communityAddFriend: 'Agregar amigo',
    communityAddingFriend: 'Agregando...',
    communityFriendAddedLabel: 'Amigo agregado',

    communityFriendsTitle: 'Tus amigos',
    communityFriendsSubtitle: 'Explora cómo florecen los jardines de tu comunidad.',
    communityRefresh: 'Actualizar',
    communityFriendsLoading: 'Cargando amigos...',
    communityFriendsError: 'No se pudieron cargar tus amigos.',
    communityNoFriends:
      'Aún no tienes amigos registrados. Busca nuevos jardineros y comparte su crecimiento emocional.',
    communityHealthLabel: 'Salud: {health}%',
    communityFriendshipSince: 'Amistad desde {date}',
    communityLastEvent: 'Último evento:',
    communityNoEventsYet: 'Aún no hay eventos registrados.',

    communitySelectedGardenTitle: 'Jardín de {name}',
    communitySelectFriend: 'Selecciona un amigo',
    communitySelectedSubtitle: 'Conoce sus eventos emocionales y acompaña su proceso de crecimiento.',
    communityProfileLoading: 'Cargando perfil...',
    communityProfileError: 'No se pudo cargar el perfil seleccionado.',
    communityGardenHealth: 'Salud del jardín: {health}%',
    communityLastUpdate: 'Última actualización:',
    communityNoGarden: 'Este usuario aún no tiene un jardín configurado.',
    communitySharedEvents: 'Eventos compartidos',
    communityNoDescriptionAvailable: 'Sin descripción disponible.',
    communityNoSharedEvents: 'Todavía no hay eventos registrados para mostrar.',
    communitySelectFriendPrompt: 'Selecciona un amigo para ver su jardín emocional.',
    communityNoFriendsProfile:
      'Cuando agregues amigos podrás explorar aquí sus jardines y eventos emocionales.',

    formErrorRegisterPlant: 'No se pudo registrar la planta.',
    formErrorUpdatePlant: 'No se pudo actualizar la planta.',
    formErrorDeletePlant: 'No se pudo eliminar la planta.',
    authErrorRegister: 'Error al registrar.',
    authErrorLogin: 'Error al iniciar sesión.',
    authErrorFetchGarden: 'No se pudo obtener el jardín.',
    communityErrorAddFriend: 'No se pudo agregar a la persona seleccionada.',
    communityActionError: 'No se pudo registrar tu interacción. Inténtalo de nuevo.',
    communityWorking: 'Procesando...',
    communityLikeEvent: 'Me gusta',
    communityUnlikeEvent: 'Quitar me gusta',
    communityLikeComment: 'Me gusta',
    communityUnlikeComment: 'Quitar me gusta',
    communityLikesCount: '{count} me gusta',
    communityCommentsTitle: 'Comentarios',
    communityNoComments: 'Sé la primera persona en comentar.',
    communityCommentPlaceholder: 'Comparte un mensaje de apoyo para tu amigo...',
    communityCommentButton: 'Publicar comentario',
    communityCommentPosting: 'Publicando...',
    communityCommentError: 'No se pudo publicar el comentario.',
    communityCommentRequired: 'Escribe un comentario antes de enviarlo.',
    communityUnknownUser: 'Persona de la comunidad',
    economySeedsLabel: 'Semillas disponibles',
    economyLoading: 'Cargando…',
    economyMedalLabel: 'Medalla de compras',
    economyMedalDescription: 'Una medalla por cada accesorio adquirido.',
    economyShopTitle: 'Tienda de accesorios',
    economyAccessoryOwnedLabel: 'Tienes {count}',
    economyProcessing: 'Procesando...',
    economyBuyButton: 'Comprar',
    economySellButton: 'Vender (+{value} 🌱)',
    economyGiftButton: 'Regalar',
    economySeedTransferTitle: 'Regalar semillas',
    economySeedTransferSubtitle: 'Envía semillas a tus amigos como muestra de apoyo.',
    economySeedTransferRecipient: 'Nombre de usuario destinatario',
    economySeedTransferRecipientPlaceholder: 'Ej. test',
    economySeedTransferAmount: 'Cantidad de semillas',
    economySeedTransferMessage: 'Mensaje (opcional)',
    economySeedTransferSubmit: 'Enviar regalo',
    economyPendingGiftsTitle: 'Regalos pendientes',
    economyPendingSeedsLabel: 'Semillas recibidas',
    economyNoPendingSeeds: 'No tienes semillas pendientes.',
    economyTransferFromLabel: '{name} te envió {amount} 🌱',
    economyAcceptButton: 'Aceptar',
    economyRejectButton: 'Rechazar',
    economyPendingSeedsOutgoingLabel: 'Semillas que enviaste',
    economyTransferToLabel: 'Esperando aceptación de {name} ({amount} 🌱)',
    economyPendingAccessoriesLabel: 'Accesorios recibidos',
    economyNoPendingAccessories: 'No tienes accesorios pendientes.',
    economyAccessoryTransferFromLabel: '{name} compartió {amount} × {item}',
    economyPendingAccessoriesOutgoingLabel: 'Accesorios que enviaste',
    economyAccessoryTransferToLabel: 'Esperando aceptación de {name} ({amount} × {item})',
    economyOverviewError: 'No se pudo cargar la información de la tienda.',
    economyPurchaseSuccess: 'Añadiste {name} a tu planta.',
    economyPurchaseGenericSuccess: 'Compra registrada correctamente.',
    economyPurchaseError: 'No se pudo completar la compra.',
    economySellSuccess: 'Vendiste {name}.',
    economySellGenericSuccess: 'Venta realizada correctamente.',
    economySellError: 'No se pudo vender el accesorio.',
    economyAccessoryTransferPromptUser:
      '¿A quién quieres enviar este accesorio? Escribe su nombre de usuario.',
    economyAccessoryTransferPromptQuantity: '¿Cuántas unidades quieres enviar?',
    economyAccessoryTransferSuccess: 'El accesorio fue enviado y está pendiente de aprobación.',
    economyAccessoryTransferError: 'No se pudo transferir el accesorio.',
    economySeedTransferSuccess: 'El regalo de semillas está en camino.',
    economySeedTransferError: 'No se pudo enviar las semillas. Revisa la información.',
    economyAcceptTransferSuccess: 'Regalo aceptado correctamente.',
    economyRejectTransferSuccess: 'Regalo gestionado correctamente.',
    economyTransferUpdateError: 'No se pudo actualizar el estado del regalo.',
  },
  en: {
    headerTitle: 'My Mental Garden',
    navGarden: 'Garden',
    navHistory: 'History',
    navCommunity: 'Community',
    navLogout: 'Log out',
    languageLabel: 'Language',

    authWelcomeTitle: 'Welcome to My Mental Garden',
    authCreateAccountTitle: 'Create an account',
    authIntro:
      'Record the good and bad moments of your day, classify them by category, and watch the plant that represents your wellbeing evolve.',
    authUsernameLabel: 'Username',
    authEmailLabel: 'Email',
    authPasswordLabel: 'Password',
    authProcessing: 'Processing...',
    authLoginButton: 'Sign in',
    authRegisterButton: 'Sign up',
    authNoAccount: "Don't have an account?",
    authHaveAccount: 'Already have an account?',
    authRegisterLink: 'Register',
    authLoginLink: 'Sign in',
    authDemoTitle: 'Want to explore quickly?',
    authDemoText:
      'Use the demo user {email} with password {password} to explore a garden with recorded events.',
    authDemoButton: 'Fill demo credentials',

    gardenLoading: 'Loading your garden...',
    gardenHealth: 'Garden health: {health}%',
    gardenMoodNeedsCare: 'Your garden needs care.',
    gardenMoodBalanced: 'Your garden is in balance.',
    gardenMoodFlourishing: 'Your garden is flourishing!',
    gardenMoodDescription:
      'Each emotion you log is a watering or a drought for your inner plant. Use categories to detect patterns and balance your days.',
    gardenRecordEvent: 'Log emotional event',
    gardenEditButton: 'Edit',
    gardenDeleteButton: 'Delete',
    gardenNoCategory: 'No category',
    gardenTypePositive: 'Positive',
    gardenTypeNegative: 'Negative',
    gardenTypeNeutral: 'Neutral',
    gardenNoDescription: 'No description',
    gardenNoEvents:
      "You don't have any logged events yet. Each emotion you register will nourish or drain your plant depending on its impact.",
    gardenFormTitle: 'Log emotion',
    gardenFormDescription:
      'Describe what happened, categorize it, and tell us how it affected your day. That way we can see the garden thrive or decline.',
    gardenFormName: 'Name',
    gardenFormCategory: 'Category',
    gardenFormCategoryPlaceholder: 'E.g. Work, Relationships, Self-care',
    gardenFormType: 'Type',
    gardenFormDescriptionLabel: 'Description',
    gardenFormDescriptionPlaceholder: 'Describe what happened or how you felt',
    gardenFormCancel: 'Cancel',
    gardenFormSave: 'Save',
    gardenFormSaving: 'Saving...',
    gardenEditTitle: 'Update description',
    gardenEditCancel: 'Cancel',
    gardenEditUpdate: 'Update',

    historyTitle: 'Emotion history',
    historySubtitle: 'Explore how your mental garden has evolved.',
    historyRange7: 'Last 7 days',
    historyRange30: 'Last 30 days',
    historyRangeAll: 'Entire history',
    historyLoading: 'Loading history...',
    historyError: 'The history could not be loaded.',
    historyNoCategory: 'No category',
    historyNoDescription: 'No description',
    historyEmptyRange: 'There are no events recorded in this period.',

    communitySearchTitle: 'Find community',
    communitySearchSubtitle:
      'Discover other emotional gardeners by username and add them as friends.',
    communitySearchPlaceholder: 'Search by username',
    communitySearchButton: 'Search',
    communitySearching: 'Searching...',
    communitySearchMinChars: 'Type at least 2 characters to search.',
    communitySearchError: 'The search could not be completed.',
    communityFriendAdded: '{name} is now part of your social garden.',
    communityFriendAddedGeneric: 'The new friend was added successfully.',
    communityAlreadyFriend: 'Already one of your friends',
    communityAddFriend: 'Add friend',
    communityAddingFriend: 'Adding...',
    communityFriendAddedLabel: 'Friend added',

    communityFriendsTitle: 'Your friends',
    communityFriendsSubtitle: 'See how the gardens of your community are flourishing.',
    communityRefresh: 'Refresh',
    communityFriendsLoading: 'Loading friends...',
    communityFriendsError: 'Your friends could not be loaded.',
    communityNoFriends:
      "You don't have any friends yet. Search for new gardeners and share their emotional growth.",
    communityHealthLabel: 'Health: {health}%',
    communityFriendshipSince: 'Friends since {date}',
    communityLastEvent: 'Latest event:',
    communityNoEventsYet: 'No events recorded yet.',

    communitySelectedGardenTitle: "{name}'s garden",
    communitySelectFriend: 'Select a friend',
    communitySelectedSubtitle: 'Discover their emotional events and support their growth.',
    communityProfileLoading: 'Loading profile...',
    communityProfileError: 'The selected profile could not be loaded.',
    communityGardenHealth: 'Garden health: {health}%',
    communityLastUpdate: 'Last update:',
    communityNoGarden: 'This user does not have a garden configured yet.',
    communitySharedEvents: 'Shared events',
    communityNoDescriptionAvailable: 'No description available.',
    communityNoSharedEvents: 'There are no events to show yet.',
    communitySelectFriendPrompt: 'Select a friend to see their emotional garden.',
    communityNoFriendsProfile:
      'Once you add friends you will be able to explore their gardens and emotional events here.',

    formErrorRegisterPlant: 'The plant could not be registered.',
    formErrorUpdatePlant: 'The plant could not be updated.',
    formErrorDeletePlant: 'The plant could not be deleted.',
    authErrorRegister: 'Error while registering.',
    authErrorLogin: 'Error while signing in.',
    authErrorFetchGarden: 'The garden could not be retrieved.',
    communityErrorAddFriend: 'The selected person could not be added.',
    communityActionError: 'We could not save your interaction. Please try again.',
    communityWorking: 'Working...',
    communityLikeEvent: 'Like',
    communityUnlikeEvent: 'Unlike',
    communityLikeComment: 'Like',
    communityUnlikeComment: 'Unlike',
    communityLikesCount: '{count} likes',
    communityCommentsTitle: 'Comments',
    communityNoComments: 'Be the first to leave a comment.',
    communityCommentPlaceholder: 'Share a supportive message for your friend...',
    communityCommentButton: 'Post comment',
    communityCommentPosting: 'Posting...',
    communityCommentError: 'The comment could not be posted.',
    communityCommentRequired: 'Please write a comment before sending it.',
    communityUnknownUser: 'Community member',
    economySeedsLabel: 'Seeds available',
    economyLoading: 'Loading…',
    economyMedalLabel: 'Accessory medal',
    economyMedalDescription: 'One medal for every accessory you have purchased.',
    economyShopTitle: 'Accessory shop',
    economyAccessoryOwnedLabel: 'You own {count}',
    economyProcessing: 'Processing...',
    economyBuyButton: 'Buy',
    economySellButton: 'Sell (+{value} 🌱)',
    economyGiftButton: 'Gift',
    economySeedTransferTitle: 'Send seeds',
    economySeedTransferSubtitle: 'Share seeds with friends as a sign of support.',
    economySeedTransferRecipient: 'Recipient username',
    economySeedTransferRecipientPlaceholder: 'e.g. test',
    economySeedTransferAmount: 'Amount of seeds',
    economySeedTransferMessage: 'Message (optional)',
    economySeedTransferSubmit: 'Send gift',
    economyPendingGiftsTitle: 'Pending gifts',
    economyPendingSeedsLabel: 'Seeds received',
    economyNoPendingSeeds: 'You have no pending seeds.',
    economyTransferFromLabel: '{name} sent you {amount} 🌱',
    economyAcceptButton: 'Accept',
    economyRejectButton: 'Decline',
    economyPendingSeedsOutgoingLabel: 'Seeds you sent',
    economyTransferToLabel: 'Waiting for {name} ({amount} 🌱)',
    economyPendingAccessoriesLabel: 'Accessories received',
    economyNoPendingAccessories: 'You have no pending accessories.',
    economyAccessoryTransferFromLabel: '{name} shared {amount} × {item}',
    economyPendingAccessoriesOutgoingLabel: 'Accessories you sent',
    economyAccessoryTransferToLabel: 'Waiting for {name} ({amount} × {item})',
    economyOverviewError: 'We could not load the shop right now.',
    economyPurchaseSuccess: '{name} was added to your plant.',
    economyPurchaseGenericSuccess: 'Purchase completed successfully.',
    economyPurchaseError: 'We could not complete the purchase.',
    economySellSuccess: 'You sold {name}.',
    economySellGenericSuccess: 'Sale completed successfully.',
    economySellError: 'We could not sell the accessory.',
    economyAccessoryTransferPromptUser: 'Who should receive this accessory? Enter their username.',
    economyAccessoryTransferPromptQuantity: 'How many units do you want to send?',
    economyAccessoryTransferSuccess: 'The accessory was sent and is awaiting approval.',
    economyAccessoryTransferError: 'We could not transfer the accessory.',
    economySeedTransferSuccess: 'Your seed gift is on its way.',
    economySeedTransferError: 'We could not send the seeds. Check the details.',
    economyAcceptTransferSuccess: 'Gift accepted successfully.',
    economyRejectTransferSuccess: 'Gift handled successfully.',
    economyTransferUpdateError: 'We could not update the gift status.',
  },
  fr: {
    headerTitle: 'Mon Jardin Mental',
    navGarden: 'Jardin',
    navHistory: 'Historique',
    navCommunity: 'Communauté',
    navLogout: 'Se déconnecter',
    languageLabel: 'Langue',

    authWelcomeTitle: 'Bienvenue dans Mon Jardin Mental',
    authCreateAccountTitle: 'Créer un compte',
    authIntro:
      'Enregistre les bonnes et les mauvaises expériences de ta journée, classe-les par catégorie et observe comment la plante qui représente ton bien-être évolue.',
    authUsernameLabel: "Nom d'utilisateur",
    authEmailLabel: 'Email',
    authPasswordLabel: 'Mot de passe',
    authProcessing: 'Traitement...',
    authLoginButton: 'Se connecter',
    authRegisterButton: "S'inscrire",
    authNoAccount: "Tu n'as pas de compte ?",
    authHaveAccount: 'Tu as déjà un compte ?',
    authRegisterLink: "Inscris-toi",
    authLoginLink: 'Connecte-toi',
    authDemoTitle: 'Envie de découvrir rapidement ?',
    authDemoText:
      "Utilise l'utilisateur de démonstration {email} avec le mot de passe {password} pour découvrir un jardin avec des événements enregistrés.",
    authDemoButton: 'Remplir les identifiants de démo',

    gardenLoading: 'Chargement de ton jardin...',
    gardenHealth: 'Santé du jardin : {health}%',
    gardenMoodNeedsCare: 'Ton jardin a besoin de soins.',
    gardenMoodBalanced: 'Ton jardin est équilibré.',
    gardenMoodFlourishing: 'Ton jardin est en pleine floraison !',
    gardenMoodDescription:
      "Chaque émotion enregistrée est un arrosage ou une sécheresse pour ta plante intérieure. Utilise les catégories pour détecter des schémas et équilibrer tes journées.",
    gardenRecordEvent: 'Enregistrer un événement émotionnel',
    gardenEditButton: 'Modifier',
    gardenDeleteButton: 'Supprimer',
    gardenNoCategory: 'Sans catégorie',
    gardenTypePositive: 'Positif',
    gardenTypeNegative: 'Négatif',
    gardenTypeNeutral: 'Neutre',
    gardenNoDescription: 'Sans description',
    gardenNoEvents:
      "Tu n'as pas encore enregistré d'événements. Chaque émotion que tu notes nourrira ou fatiguera ta plante selon son impact.",
    gardenFormTitle: 'Enregistrer une émotion',
    gardenFormDescription:
      'Décris ce qui est arrivé, classe-le et raconte-nous comment cela a impacté ta journée. Nous verrons ainsi le jardin croître ou décliner.',
    gardenFormName: 'Nom',
    gardenFormCategory: 'Catégorie',
    gardenFormCategoryPlaceholder: 'Ex. Travail, Relations, Auto-soin',
    gardenFormType: 'Type',
    gardenFormDescriptionLabel: 'Description',
    gardenFormDescriptionPlaceholder: 'Décris ce qui est arrivé ou ce que tu as ressenti',
    gardenFormCancel: 'Annuler',
    gardenFormSave: 'Enregistrer',
    gardenFormSaving: 'Enregistrement...',
    gardenEditTitle: 'Mettre à jour la description',
    gardenEditCancel: 'Annuler',
    gardenEditUpdate: 'Mettre à jour',

    historyTitle: 'Historique des émotions',
    historySubtitle: 'Explore comment ton jardin mental a évolué.',
    historyRange7: '7 derniers jours',
    historyRange30: '30 derniers jours',
    historyRangeAll: "Tout l'historique",
    historyLoading: "Chargement de l'historique...",
    historyError: "Impossible de charger l'historique.",
    historyNoCategory: 'Sans catégorie',
    historyNoDescription: 'Sans description',
    historyEmptyRange: "Aucun événement enregistré durant cette période.",

    communitySearchTitle: 'Rechercher dans la communauté',
    communitySearchSubtitle:
      "Trouve d'autres jardiniers émotionnels par leur nom d'utilisateur et ajoute-les comme amis.",
    communitySearchPlaceholder: "Rechercher par nom d'utilisateur",
    communitySearchButton: 'Rechercher',
    communitySearching: 'Recherche...',
    communitySearchMinChars: 'Tape au moins 2 caractères pour rechercher.',
    communitySearchError: 'La recherche a échoué.',
    communityFriendAdded: '{name} fait maintenant partie de ton jardin social.',
    communityFriendAddedGeneric: "Le nouvel ami a été ajouté avec succès.",
    communityAlreadyFriend: 'Fait déjà partie de tes amis',
    communityAddFriend: 'Ajouter ami',
    communityAddingFriend: 'Ajout...',
    communityFriendAddedLabel: 'Ami ajouté',

    communityFriendsTitle: 'Tes amis',
    communityFriendsSubtitle: 'Découvre comment fleurissent les jardins de ta communauté.',
    communityRefresh: 'Rafraîchir',
    communityFriendsLoading: 'Chargement des amis...',
    communityFriendsError: "Impossible de charger tes amis.",
    communityNoFriends:
      "Tu n'as pas encore d'amis enregistrés. Cherche de nouveaux jardiniers et partage leur croissance émotionnelle.",
    communityHealthLabel: 'Santé : {health}%',
    communityFriendshipSince: 'Amitié depuis {date}',
    communityLastEvent: 'Dernier événement :',
    communityNoEventsYet: "Aucun événement enregistré pour le moment.",

    communitySelectedGardenTitle: 'Jardin de {name}',
    communitySelectFriend: 'Sélectionne un ami',
    communitySelectedSubtitle: 'Découvre leurs événements émotionnels et accompagne leur croissance.',
    communityProfileLoading: 'Chargement du profil...',
    communityProfileError: 'Impossible de charger le profil sélectionné.',
    communityGardenHealth: 'Santé du jardin : {health}%',
    communityLastUpdate: 'Dernière mise à jour :',
    communityNoGarden: "Cet utilisateur n'a pas encore de jardin configuré.",
    communitySharedEvents: 'Événements partagés',
    communityNoDescriptionAvailable: 'Pas de description disponible.',
    communityNoSharedEvents: "Il n'y a pas encore d'événements à afficher.",
    communitySelectFriendPrompt: 'Sélectionne un ami pour voir son jardin émotionnel.',
    communityNoFriendsProfile:
      'Lorsque tu ajouteras des amis, tu pourras explorer ici leurs jardins et événements émotionnels.',

    formErrorRegisterPlant: "Impossible d'enregistrer la plante.",
    formErrorUpdatePlant: 'Impossible de mettre à jour la plante.',
    formErrorDeletePlant: 'Impossible de supprimer la plante.',
    authErrorRegister: "Erreur lors de l'inscription.",
    authErrorLogin: 'Erreur lors de la connexion.',
    authErrorFetchGarden: "Impossible d'obtenir le jardin.",
    communityErrorAddFriend: "Impossible d'ajouter la personne sélectionnée.",
    communityActionError: "Impossible d'enregistrer ton interaction. Réessaie.",
    communityWorking: 'En cours...',
    communityLikeEvent: "J'aime",
    communityUnlikeEvent: "Ne plus aimer",
    communityLikeComment: "J'aime",
    communityUnlikeComment: "Ne plus aimer",
    communityLikesCount: "{count} mentions j'aime",
    communityCommentsTitle: 'Commentaires',
    communityNoComments: 'Sois la première personne à commenter.',
    communityCommentPlaceholder: 'Partage un message de soutien pour ton ami...',
    communityCommentButton: 'Publier le commentaire',
    communityCommentPosting: 'Publication...',
    communityCommentError: "Impossible de publier le commentaire.",
    communityCommentRequired: "Écris un commentaire avant de l'envoyer.",
    communityUnknownUser: 'Membre de la communauté',
    economySeedsLabel: 'Graines disponibles',
    economyLoading: 'Chargement…',
    economyMedalLabel: 'Médaille d’achats',
    economyMedalDescription: 'Une médaille pour chaque accessoire acheté.',
    economyShopTitle: 'Boutique d’accessoires',
    economyAccessoryOwnedLabel: 'Tu possèdes {count}',
    economyProcessing: 'Traitement...',
    economyBuyButton: 'Acheter',
    economySellButton: 'Vendre (+{value} 🌱)',
    economyGiftButton: 'Offrir',
    economySeedTransferTitle: 'Offrir des graines',
    economySeedTransferSubtitle: 'Partage des graines avec tes amis pour les encourager.',
    economySeedTransferRecipient: 'Nom d’utilisateur destinataire',
    economySeedTransferRecipientPlaceholder: 'ex. test',
    economySeedTransferAmount: 'Quantité de graines',
    economySeedTransferMessage: 'Message (facultatif)',
    economySeedTransferSubmit: 'Envoyer le cadeau',
    economyPendingGiftsTitle: 'Cadeaux en attente',
    economyPendingSeedsLabel: 'Graines reçues',
    economyNoPendingSeeds: 'Tu n’as pas de graines en attente.',
    economyTransferFromLabel: '{name} t’a envoyé {amount} 🌱',
    economyAcceptButton: 'Accepter',
    economyRejectButton: 'Refuser',
    economyPendingSeedsOutgoingLabel: 'Graines que tu as envoyées',
    economyTransferToLabel: 'En attente pour {name} ({amount} 🌱)',
    economyPendingAccessoriesLabel: 'Accessoires reçus',
    economyNoPendingAccessories: 'Tu n’as pas d’accessoires en attente.',
    economyAccessoryTransferFromLabel: '{name} a partagé {amount} × {item}',
    economyPendingAccessoriesOutgoingLabel: 'Accessoires que tu as envoyés',
    economyAccessoryTransferToLabel: 'En attente pour {name} ({amount} × {item})',
    economyOverviewError: 'Impossible de charger la boutique pour le moment.',
    economyPurchaseSuccess: '{name} a été ajouté à ta plante.',
    economyPurchaseGenericSuccess: 'Achat effectué avec succès.',
    economyPurchaseError: 'Impossible de finaliser l’achat.',
    economySellSuccess: 'Tu as vendu {name}.',
    economySellGenericSuccess: 'Vente réalisée avec succès.',
    economySellError: 'Impossible de vendre cet accessoire.',
    economyAccessoryTransferPromptUser:
      'À qui veux-tu envoyer cet accessoire ? Entre son nom d’utilisateur.',
    economyAccessoryTransferPromptQuantity: 'Combien d’unités veux-tu envoyer ?',
    economyAccessoryTransferSuccess: 'L’accessoire a été envoyé et attend une validation.',
    economyAccessoryTransferError: 'Impossible de transférer cet accessoire.',
    economySeedTransferSuccess: 'Ton cadeau de graines est en route.',
    economySeedTransferError: 'Impossible d’envoyer les graines. Vérifie les informations.',
    economyAcceptTransferSuccess: 'Cadeau accepté avec succès.',
    economyRejectTransferSuccess: 'Cadeau géré avec succès.',
    economyTransferUpdateError: 'Impossible de mettre à jour le statut du cadeau.',
  },
  ar: {
    headerTitle: 'حديقتي الذهنية',
    navGarden: 'الحديقة',
    navHistory: 'السجل',
    navCommunity: 'المجتمع',
    navLogout: 'تسجيل الخروج',
    languageLabel: 'اللغة',

    authWelcomeTitle: 'مرحبًا بك في حديقتي الذهنية',
    authCreateAccountTitle: 'إنشاء حساب',
    authIntro:
      'سجل اللحظات الجيدة والسيئة في يومك، صنّفها حسب الفئة، وراقب كيف تنمو النبتة التي تمثل رفاهك.',
    authUsernameLabel: 'اسم المستخدم',
    authEmailLabel: 'البريد الإلكتروني',
    authPasswordLabel: 'كلمة المرور',
    authProcessing: 'جارٍ المعالجة...',
    authLoginButton: 'تسجيل الدخول',
    authRegisterButton: 'التسجيل',
    authNoAccount: 'ليس لديك حساب؟',
    authHaveAccount: 'لديك حساب بالفعل؟',
    authRegisterLink: 'سجل الآن',
    authLoginLink: 'سجّل الدخول',
    authDemoTitle: 'هل تريد الاستكشاف بسرعة؟',
    authDemoText:
      'استخدم حساب العرض {email} مع كلمة المرور {password} لاستكشاف حديقة تحتوي على أحداث مسجلة.',
    authDemoButton: 'املأ بيانات العرض التوضيحي',

    gardenLoading: 'جارٍ تحميل حديقتك...',
    gardenHealth: 'صحة الحديقة: {health}%',
    gardenMoodNeedsCare: 'حديقتك تحتاج إلى عناية.',
    gardenMoodBalanced: 'حديقتك متوازنة.',
    gardenMoodFlourishing: 'حديقتك تزدهر!',
    gardenMoodDescription:
      'كل شعور تسجله هو سقي أو جفاف لنبتتك الداخلية. استخدم الفئات للتعرف على الأنماط وموازنة أيامك.',
    gardenRecordEvent: 'سجّل حدثًا شعوريًا',
    gardenEditButton: 'تعديل',
    gardenDeleteButton: 'حذف',
    gardenNoCategory: 'بدون فئة',
    gardenTypePositive: 'إيجابي',
    gardenTypeNegative: 'سلبي',
    gardenTypeNeutral: 'محايد',
    gardenNoDescription: 'لا يوجد وصف',
    gardenNoEvents:
      'لا توجد لديك أحداث مسجلة بعد. كل شعور تسجله سيغذي أو يستنزف نبتتك بحسب تأثيره.',
    gardenFormTitle: 'سجّل شعورًا',
    gardenFormDescription:
      'صف ما حدث، صنّفه، وأخبرنا كيف أثر في يومك. هكذا سنرى الحديقة تنمو أو تذبل.',
    gardenFormName: 'الاسم',
    gardenFormCategory: 'الفئة',
    gardenFormCategoryPlaceholder: 'مثال: العمل، العلاقات، العناية بالذات',
    gardenFormType: 'النوع',
    gardenFormDescriptionLabel: 'الوصف',
    gardenFormDescriptionPlaceholder: 'صف ما حدث أو كيف شعرت',
    gardenFormCancel: 'إلغاء',
    gardenFormSave: 'حفظ',
    gardenFormSaving: 'جارٍ الحفظ...',
    gardenEditTitle: 'تحديث الوصف',
    gardenEditCancel: 'إلغاء',
    gardenEditUpdate: 'تحديث',

    historyTitle: 'سجل المشاعر',
    historySubtitle: 'استكشف كيف تطورت حديقتك الذهنية.',
    historyRange7: 'آخر 7 أيام',
    historyRange30: 'آخر 30 يومًا',
    historyRangeAll: 'كامل السجل',
    historyLoading: 'جارٍ تحميل السجل...',
    historyError: 'تعذر تحميل السجل.',
    historyNoCategory: 'بدون فئة',
    historyNoDescription: 'لا يوجد وصف',
    historyEmptyRange: 'لا توجد أحداث مسجلة في هذه الفترة.',

    communitySearchTitle: 'ابحث في المجتمع',
    communitySearchSubtitle:
      'اكتشف بستانيين شعوريين آخرين بواسطة اسم المستخدم وأضفهم كأصدقاء.',
    communitySearchPlaceholder: 'ابحث باسم المستخدم',
    communitySearchButton: 'بحث',
    communitySearching: 'جارٍ البحث...',
    communitySearchMinChars: 'اكتب حرفين على الأقل للبحث.',
    communitySearchError: 'تعذر إتمام البحث.',
    communityFriendAdded: '{name} أصبح الآن جزءًا من حديقتك الاجتماعية.',
    communityFriendAddedGeneric: 'تمت إضافة الصديق الجديد بنجاح.',
    communityAlreadyFriend: 'هو بالفعل من أصدقائك',
    communityAddFriend: 'أضف صديقًا',
    communityAddingFriend: 'جارٍ الإضافة...',
    communityFriendAddedLabel: 'تمت إضافة الصديق',

    communityFriendsTitle: 'أصدقاؤك',
    communityFriendsSubtitle: 'اكتشف كيف تزدهر حدائق مجتمعك.',
    communityRefresh: 'تحديث',
    communityFriendsLoading: 'جارٍ تحميل الأصدقاء...',
    communityFriendsError: 'تعذر تحميل أصدقائك.',
    communityNoFriends:
      'ليس لديك أصدقاء بعد. ابحث عن بستانيين جدد وشارك نموهم الشعوري.',
    communityHealthLabel: 'الصحة: {health}%',
    communityFriendshipSince: 'صداقة منذ {date}',
    communityLastEvent: 'أحدث حدث:',
    communityNoEventsYet: 'لا توجد أحداث مسجلة بعد.',

    communitySelectedGardenTitle: 'حديقة {name}',
    communitySelectFriend: 'اختر صديقًا',
    communitySelectedSubtitle: 'اكتشف أحداثهم الشعورية وساند نموهم.',
    communityProfileLoading: 'جارٍ تحميل الملف الشخصي...',
    communityProfileError: 'تعذر تحميل الملف الشخصي المحدد.',
    communityGardenHealth: 'صحة الحديقة: {health}%',
    communityLastUpdate: 'آخر تحديث:',
    communityNoGarden: 'هذا المستخدم لم يُنشئ حديقة بعد.',
    communitySharedEvents: 'الأحداث المشتركة',
    communityNoDescriptionAvailable: 'لا يوجد وصف متاح.',
    communityNoSharedEvents: 'لا توجد أحداث لعرضها بعد.',
    communitySelectFriendPrompt: 'اختر صديقًا لعرض حديقته الشعورية.',
    communityNoFriendsProfile:
      'عندما تضيف أصدقاء ستتمكن من استكشاف حدائقهم وأحداثهم الشعورية هنا.',

    formErrorRegisterPlant: 'تعذر تسجيل النبتة.',
    formErrorUpdatePlant: 'تعذر تحديث النبتة.',
    formErrorDeletePlant: 'تعذر حذف النبتة.',
    authErrorRegister: 'حدث خطأ أثناء التسجيل.',
    authErrorLogin: 'حدث خطأ أثناء تسجيل الدخول.',
    authErrorFetchGarden: 'تعذر جلب الحديقة.',
    communityErrorAddFriend: 'تعذر إضافة الشخص المحدد.',
    communityActionError: 'تعذر حفظ تفاعلك. حاول مرة أخرى.',
    communityWorking: 'جارٍ التنفيذ...',
    communityLikeEvent: 'إعجاب',
    communityUnlikeEvent: 'إزالة الإعجاب',
    communityLikeComment: 'إعجاب',
    communityUnlikeComment: 'إزالة الإعجاب',
    communityLikesCount: '{count} إعجابات',
    communityCommentsTitle: 'التعليقات',
    communityNoComments: 'كن أول من يعلّق.',
    communityCommentPlaceholder: 'شارك رسالة دعم لصديقك...',
    communityCommentButton: 'نشر التعليق',
    communityCommentPosting: 'جارٍ النشر...',
    communityCommentError: 'تعذر نشر التعليق.',
    communityCommentRequired: 'اكتب تعليقًا قبل الإرسال.',
    communityUnknownUser: 'عضو في المجتمع',
    economySeedsLabel: 'البذور المتاحة',
    economyLoading: 'جارٍ التحميل…',
    economyMedalLabel: 'وسام الإكسسوارات',
    economyMedalDescription: 'وسام لكل إكسسوار قمت بشرائه.',
    economyShopTitle: 'متجر الإكسسوارات',
    economyAccessoryOwnedLabel: 'لديك {count}',
    economyProcessing: 'جارٍ المعالجة...',
    economyBuyButton: 'شراء',
    economySellButton: 'بيع (+{value} 🌱)',
    economyGiftButton: 'إهداء',
    economySeedTransferTitle: 'إهداء بذور',
    economySeedTransferSubtitle: 'أرسل البذور لأصدقائك كرسالة دعم.',
    economySeedTransferRecipient: 'اسم المستخدم المستلم',
    economySeedTransferRecipientPlaceholder: 'مثال: test',
    economySeedTransferAmount: 'عدد البذور',
    economySeedTransferMessage: 'رسالة (اختياري)',
    economySeedTransferSubmit: 'إرسال الهدية',
    economyPendingGiftsTitle: 'هدايا بانتظار القبول',
    economyPendingSeedsLabel: 'بذور مستلمة',
    economyNoPendingSeeds: 'لا توجد بذور بانتظار القبول.',
    economyTransferFromLabel: '{name} أرسل لك {amount} 🌱',
    economyAcceptButton: 'قبول',
    economyRejectButton: 'رفض',
    economyPendingSeedsOutgoingLabel: 'البذور التي أرسلتها',
    economyTransferToLabel: 'بانتظار {name} ({amount} 🌱)',
    economyPendingAccessoriesLabel: 'إكسسوارات مستلمة',
    economyNoPendingAccessories: 'لا توجد إكسسوارات بانتظار القبول.',
    economyAccessoryTransferFromLabel: '{name} شارك {amount} × {item}',
    economyPendingAccessoriesOutgoingLabel: 'الإكسسوارات التي أرسلتها',
    economyAccessoryTransferToLabel: 'بانتظار {name} ({amount} × {item})',
    economyOverviewError: 'تعذر تحميل بيانات المتجر حاليًا.',
    economyPurchaseSuccess: 'تمت إضافة {name} إلى نبتتك.',
    economyPurchaseGenericSuccess: 'تم إكمال عملية الشراء بنجاح.',
    economyPurchaseError: 'تعذر إكمال عملية الشراء.',
    economySellSuccess: 'تم بيع {name}.',
    economySellGenericSuccess: 'تم إكمال عملية البيع بنجاح.',
    economySellError: 'تعذر بيع الإكسسوار.',
    economyAccessoryTransferPromptUser: 'إلى من تريد إرسال هذا الإكسسوار؟ اكتب اسم المستخدم.',
    economyAccessoryTransferPromptQuantity: 'كم عدد القطع التي تريد إرسالها؟',
    economyAccessoryTransferSuccess: 'تم إرسال الإكسسوار وينتظر الموافقة.',
    economyAccessoryTransferError: 'تعذر إرسال الإكسسوار.',
    economySeedTransferSuccess: 'هدية البذور في طريقها.',
    economySeedTransferError: 'تعذر إرسال البذور. يرجى التحقق من البيانات.',
    economyAcceptTransferSuccess: 'تم قبول الهدية بنجاح.',
    economyRejectTransferSuccess: 'تم التعامل مع الهدية بنجاح.',
    economyTransferUpdateError: 'تعذر تحديث حالة الهدية.',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => getStoredLanguage());

  const changeLanguage = useCallback((nextLanguage) => {
    if (!supportedLanguages.some((lang) => lang.id === nextLanguage)) return;
    setLanguage(nextLanguage);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem('language', language);

    const url = new URL(window.location.href);
    const segments = url.pathname.split('/').filter(Boolean);
    const hasLanguageSegment =
      segments.length > 0 && supportedLanguages.some((lang) => lang.id === segments[0]);

    let nextSegments = segments;
    let shouldUpdate = false;

    if (hasLanguageSegment) {
      if (segments[0] !== language) {
        nextSegments = [language, ...segments.slice(1)];
        shouldUpdate = true;
      }
    } else {
      nextSegments = [language, ...segments];
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      const newPathname = `/${nextSegments.join('/')}`;
      const newUrl = `${newPathname}${url.search}${url.hash}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [language]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    html.lang = localeMap[language] || localeMap.es;
    html.dir = directionMap[language] || 'ltr';
  }, [language]);

  const t = useCallback(
    (key, replacements = {}) => {
      const dictionary = translations[language] || translations.es;
      const fallbackDictionary = translations.es;
      let text = dictionary[key] ?? fallbackDictionary[key] ?? key;
      if (typeof text !== 'string') return key;
      return text.replace(/\{(\w+)\}/g, (match, placeholder) =>
        Object.prototype.hasOwnProperty.call(replacements, placeholder)
          ? replacements[placeholder]
          : match
      );
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      locale: localeMap[language] || localeMap.es,
      languages: supportedLanguages,
      changeLanguage,
      t,
    }),
    [changeLanguage, language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  }
  return context;
};

export default LanguageContext;
