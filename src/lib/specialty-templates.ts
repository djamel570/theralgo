/**
 * Specialty Templates Library
 *
 * Pre-validated intention segments, creative angles, hooks, and campaign structures
 * organized by therapist specialty. Claude uses these as a foundation and adapts them
 * to each therapist's specific profile rather than inventing everything from scratch.
 *
 * This ensures consistency across therapists of the same specialty while still
 * allowing personalization.
 */

export interface SpecialtyTemplate {
  specialty_key: string
  specialty_label: string

  // Pre-defined intention segments for this specialty
  intention_segments: Array<{
    name: string
    description: string
    temperature: 'cold' | 'warm' | 'hot'
    media_priority: 'high' | 'medium' | 'low'
    typical_situations: string[]
    keywords_fr: string[] // For reference, NOT for Meta targeting
  }>

  // Pre-defined hook templates (with {variables} to fill)
  hook_templates: Array<{
    template: string // e.g. "Vous souffrez de {pain_point} depuis trop longtemps ?"
    angle: 'educational' | 'transformation' | 'reassurance' | 'urgency' | 'social_proof'
    segment_match: string[] // Which segment names this hook works for
  }>

  // Pre-defined promise templates
  promise_templates: Array<{
    template: string
    proof_type: 'result' | 'method' | 'experience' | 'testimonial'
  }>

  // Common objections for this specialty
  objections: Array<{
    objection: string
    response_template: string
  }>

  // Recommended campaign structure defaults
  campaign_defaults: {
    recommended_objective: string
    recommended_optimization_event: string
    min_daily_budget_cents: number
    recommended_daily_budget_cents: number
    recommended_age_min: number
    recommended_age_max: number
    recommended_radius_km: number
    recommended_platforms: string[]
    learning_period_days: number
  }

  // FAQ templates for landing pages
  faq_templates: Array<{
    question: string
    answer_template: string
  }>
}

// ═══════════════════════════════════════════════
// HYPNOTHERAPEUTE
// ═══════════════════════════════════════════════
const hypnotherapeute: SpecialtyTemplate = {
  specialty_key: 'hypnotherapeute',
  specialty_label: 'Hypnothérapeute',

  intention_segments: [
    {
      name: 'Arrêt du tabac',
      description: 'Personnes motivées à arrêter de fumer, souvent après plusieurs tentatives échouées avec d\'autres méthodes.',
      temperature: 'hot',
      media_priority: 'high',
      typical_situations: [
        'A essayé les patchs sans succès',
        'Grossesse ou projet de grossesse',
        'Problème de santé lié au tabac',
        'Hausse du prix du tabac',
        'Pression de l\'entourage',
      ],
      keywords_fr: ['arrêter de fumer', 'sevrage tabac', 'hypnose tabac', 'quit smoking'],
    },
    {
      name: 'Gestion du stress et anxiété',
      description: 'Personnes en souffrance face au stress quotidien, burn-out, ou anxiété généralisée cherchant une approche douce.',
      temperature: 'warm',
      media_priority: 'high',
      typical_situations: [
        'Pression au travail insoutenable',
        'Troubles du sommeil liés au stress',
        'Crises d\'angoisse récurrentes',
        'Surmenage parental',
        'Période de transition de vie stressante',
      ],
      keywords_fr: ['stress', 'anxiété', 'angoisse', 'burn-out', 'relaxation'],
    },
    {
      name: 'Perte de poids',
      description: 'Personnes en surpoids qui ont tout essayé (régimes, sport) et cherchent à traiter la cause comportementale.',
      temperature: 'warm',
      media_priority: 'medium',
      typical_situations: [
        'Régimes yo-yo depuis des années',
        'Grignotage compulsif ou alimentation émotionnelle',
        'Relation émotionnelle à la nourriture',
        'Objectif minceur pour un événement',
      ],
      keywords_fr: ['perte de poids', 'maigrir', 'hypnose minceur', 'alimentation'],
    },
    {
      name: 'Confiance en soi et estime',
      description: 'Personnes souffrant de manque de confiance, syndrome de l\'imposteur, ou phobie sociale.',
      temperature: 'cold',
      media_priority: 'medium',
      typical_situations: [
        'Prise de parole en public difficile',
        'Syndrome de l\'imposteur au travail',
        'Difficulté relationnelle ou affective',
        'Phobie sociale limitante',
      ],
      keywords_fr: ['confiance en soi', 'estime de soi', 'phobie sociale', 'assertivité'],
    },
    {
      name: 'Phobies spécifiques',
      description: 'Personnes avec des phobies limitantes (avion, araignées, dentiste, conduite, hauteur...).',
      temperature: 'hot',
      media_priority: 'high',
      typical_situations: [
        'Phobie de l\'avion avant un voyage',
        'Peur du dentiste empêchant les soins',
        'Phobie de conduire après un accident',
        'Claustrophobie invalidante',
      ],
      keywords_fr: ['phobie', 'peur', 'hypnose phobie', 'vertiges'],
    },
    {
      name: 'Troubles du sommeil',
      description: 'Personnes souffrant d\'insomnies, réveils nocturnes, ou qualité de sommeil dégradée.',
      temperature: 'warm',
      media_priority: 'medium',
      typical_situations: [
        'Insomnie chronique depuis mois ou années',
        'Sommeil non réparateur',
        'Réveils nocturnes fréquents',
        'Difficulté d\'endormissement',
      ],
      keywords_fr: ['insomnie', 'sommeil', 'troubles du sommeil', 'dormir'],
    },
  ],

  hook_templates: [
    { template: 'Vous avez tout essayé pour {pain_point} ? L\'hypnose pourrait changer la donne.', angle: 'transformation', segment_match: ['Arrêt du tabac', 'Perte de poids'] },
    { template: 'Et si une seule séance suffisait à {desired_outcome} ?', angle: 'urgency', segment_match: ['Arrêt du tabac', 'Phobies spécifiques'] },
    { template: '{pain_point} : votre cerveau a la solution. L\'hypnose l\'active.', angle: 'educational', segment_match: ['Gestion du stress et anxiété', 'Confiance en soi et estime'] },
    { template: '80% de mes patients {result} dès la première séance.', angle: 'social_proof', segment_match: ['Arrêt du tabac', 'Phobies spécifiques'] },
    { template: 'Vous méritez de vivre sans {pain_point}. Commencez ici.', angle: 'reassurance', segment_match: ['Gestion du stress et anxiété', 'Confiance en soi et estime', 'Troubles du sommeil'] },
    { template: 'L\'hypnose n\'est pas ce que vous croyez. C\'est bien plus efficace.', angle: 'educational', segment_match: ['Arrêt du tabac', 'Perte de poids', 'Confiance en soi et estime'] },
  ],

  promise_templates: [
    { template: 'Arrêtez de fumer en 1 à 3 séances, sans manque ni prise de poids.', proof_type: 'result' },
    { template: 'Retrouvez un sommeil réparateur et une sérénité durable.', proof_type: 'result' },
    { template: 'Une méthode douce, validée scientifiquement, adaptée à votre rythme.', proof_type: 'method' },
    { template: 'Plus de {number_patients} patients accompagnés avec succès à {city}.', proof_type: 'experience' },
  ],

  objections: [
    { objection: 'L\'hypnose, ça marche vraiment ?', response_template: 'L\'hypnothérapie est reconnue par la Haute Autorité de Santé (HAS) et fait l\'objet de nombreuses études cliniques. Ce n\'est pas de l\'hypnose de spectacle — c\'est un accompagnement thérapeutique qui s\'appuie sur vos propres ressources.' },
    { objection: 'J\'ai peur de perdre le contrôle', response_template: 'En hypnose thérapeutique, vous restez conscient et en contrôle à tout moment. C\'est un état de concentration profonde, pas de soumission. Vous pouvez ouvrir les yeux et arrêter la séance à tout instant.' },
    { objection: 'Combien de séances faut-il ?', response_template: 'Chaque situation est unique. Pour l\'arrêt du tabac, 1 à 3 séances suffisent généralement. Pour le stress ou les phobies, comptez 3 à 5 séances. Nous faisons le point ensemble dès la première séance.' },
    { objection: 'C\'est cher', response_template: 'Une séance coûte {price}€. Comparez avec les dépenses mensuelles liées à votre problème (cigarettes, médicaments, arrêts maladie...). L\'hypnothérapie est un investissement qui se rentabilise rapidement.' },
  ],

  campaign_defaults: {
    recommended_objective: 'OUTCOME_LEADS',
    recommended_optimization_event: 'Lead',
    min_daily_budget_cents: 500,
    recommended_daily_budget_cents: 1500,
    recommended_age_min: 25,
    recommended_age_max: 60,
    recommended_radius_km: 20,
    recommended_platforms: ['facebook', 'instagram'],
    learning_period_days: 4,
  },

  faq_templates: [
    { question: 'Comment se déroule une séance d\'hypnose ?', answer_template: 'La séance dure environ {duration} minutes. Elle commence par un échange sur votre objectif, suivi d\'une phase d\'induction hypnotique guidée. Vous restez conscient et actif tout au long du processus.' },
    { question: 'L\'hypnose fonctionne-t-elle pour tout le monde ?', answer_template: 'La grande majorité des personnes sont réceptives à l\'hypnose. La clé est votre motivation et votre engagement dans le processus. Lors de notre premier échange, nous évaluons ensemble si l\'hypnose est adaptée à votre situation.' },
    { question: 'Est-ce remboursé ?', answer_template: 'L\'hypnothérapie n\'est pas remboursée par la Sécurité sociale, mais de nombreuses mutuelles proposent un forfait médecines douces. Renseignez-vous auprès de la vôtre.' },
  ],
}

// ═══════════════════════════════════════════════
// SOPHROLOGUE
// ═══════════════════════════════════════════════
const sophrologue: SpecialtyTemplate = {
  specialty_key: 'sophrologue',
  specialty_label: 'Sophrologue',

  intention_segments: [
    {
      name: 'Stress professionnel',
      description: 'Personnes surmenées au travail, avec pression, responsabilités écrasantes ou recherche d\'équilibre vie pro/perso.',
      temperature: 'warm',
      media_priority: 'high',
      typical_situations: [
        'Charge de travail excessive',
        'Responsabilités managériales stressantes',
        'Manque de reconnaissance',
        'Pression de résultats constante',
        'Manque de temps personnel',
      ],
      keywords_fr: ['stress travail', 'surmenage', 'équilibre vie pro', 'gestion stress professionnel'],
    },
    {
      name: 'Préparation mentale (examen/sport)',
      description: 'Étudiants, sportifs ou professionnels se préparant à un événement (examen, compétition, présentation...).',
      temperature: 'hot',
      media_priority: 'high',
      typical_situations: [
        'Examen ou concours importants',
        'Compétition sportive',
        'Présentation professionnelle majeure',
        'Peur de l\'échec',
        'Besoin de concentration intense',
      ],
      keywords_fr: ['préparation mentale', 'concentration', 'confiance sportive', 'examen'],
    },
    {
      name: 'Troubles du sommeil',
      description: 'Personnes avec insomnies, sommeil fragmenté, ou difficultés d\'endormissement affectant leur quotidien.',
      temperature: 'warm',
      media_priority: 'high',
      typical_situations: [
        'Insomnie depuis des mois',
        'Sommeil non réparateur',
        'Réveil trop tôt le matin',
        'Difficultés à s\'endormir',
        'Impact sur productivité et bien-être',
      ],
      keywords_fr: ['insomnie', 'troubles du sommeil', 'dormir', 'relaxation'],
    },
    {
      name: 'Gestion des émotions',
      description: 'Personnes ayant du mal à gérer leurs émotions (colère, tristesse, impulsivité) ou traversant une période difficile.',
      temperature: 'cold',
      media_priority: 'medium',
      typical_situations: [
        'Émotions débordantes ou incontrôlables',
        'Deuil ou perte',
        'Rupture sentimentale',
        'Réactions émotionnelles excessives',
        'Gestion de la frustration difficile',
      ],
      keywords_fr: ['gestion émotions', 'gérer colère', 'équilibre émotionnel', 'bien-être'],
    },
    {
      name: 'Accompagnement grossesse et périnatal',
      description: 'Femmes enceintes ou jeunes mères cherchant sérénité, gestion de l\'anxiété et préparation à la maternité.',
      temperature: 'warm',
      media_priority: 'medium',
      typical_situations: [
        'Grossesse anxieuse',
        'Préparation à l\'accouchement',
        'Anxiété post-partum',
        'Gestion du stress de jeune mère',
        'Bonding mère-enfant',
      ],
      keywords_fr: ['grossesse', 'préparation accouchement', 'maternité', 'postnatal'],
    },
  ],

  hook_templates: [
    { template: 'Vous vous sentez {emotional_state}. La sophrologie vous aide à reprendre le contrôle.', angle: 'reassurance', segment_match: ['Stress professionnel', 'Gestion des émotions'] },
    { template: '{big_event} approche ? Préparez-vous mentalement en quelques séances.', angle: 'urgency', segment_match: ['Préparation mentale (examen/sport)'] },
    { template: 'Votre sommeil définit votre vie. Récupérez votre nuit en 3-4 séances.', angle: 'transformation', segment_match: ['Troubles du sommeil'] },
    { template: 'La sophrologie : la méthode que {number}% de sportifs de haut niveau utilisent.', angle: 'social_proof', segment_match: ['Préparation mentale (examen/sport)'] },
    { template: 'Enceinte ? Sereine : une accompagnement sophrologique de la grossesse à l\'après-naissance.', angle: 'reassurance', segment_match: ['Accompagnement grossesse et périnatal'] },
    { template: 'Apprendre à respirer pour retrouver la paix. Simple, rapide, efficace.', angle: 'educational', segment_match: ['Stress professionnel', 'Troubles du sommeil', 'Gestion des émotions'] },
  ],

  promise_templates: [
    { template: 'Retrouvez votre calme intérieur et votre clarté mentale en quelques séances.', proof_type: 'result' },
    { template: 'Une préparation mentale progressive et adaptée à votre rythme.', proof_type: 'method' },
    { template: '{number_years} ans d\'accompagnement de patients en quête de bien-être à {city}.', proof_type: 'experience' },
    { template: 'La sophrologie : reconnue par l\'OMS comme une pratique de santé préventive.', proof_type: 'method' },
  ],

  objections: [
    { objection: 'La sophrologie, c\'est quoi exactement ?', response_template: 'La sophrologie est une discipline qui associe relaxation, respiration et visualisation positive. C\'est une méthode douce pour améliorer votre bien-être, renforcer votre confiance et votre équilibre émotionnel. Aucune spiritualité, juste des techniques éprouvées.' },
    { objection: 'Je suis trop stressé pour méditer', response_template: 'Justement ! La sophrologie n\'est pas une méditation passive. C\'est une technique active : vous respirez, vous visualisez, vous pratiquez. Cela demande simplement de la bienveillance envers vous-même.' },
    { objection: 'Ça va vraiment changer quelque chose ?', response_template: 'Oui, si vous vous engagez vraiment. Une séance de sophrologie crée une détente immédiate. Mais pour des résultats durables, il faut pratiquer régulièrement, même à la maison. Les premiers résultats apparaissent généralement après 3-4 séances.' },
    { objection: 'Combien ça coûte et pour combien de temps ?', response_template: 'Une séance coûte {price}€. Le nombre de séances dépend de votre objectif : 5-8 séances pour un accompagnement classique, 10-12 pour une préparation intensive. Nous définissons un plan ensemble.' },
  ],

  campaign_defaults: {
    recommended_objective: 'OUTCOME_LEADS',
    recommended_optimization_event: 'Lead',
    min_daily_budget_cents: 600,
    recommended_daily_budget_cents: 1200,
    recommended_age_min: 20,
    recommended_age_max: 55,
    recommended_radius_km: 25,
    recommended_platforms: ['facebook', 'instagram'],
    learning_period_days: 4,
  },

  faq_templates: [
    { question: 'La sophrologie, c\'est comme la méditation ?', answer_template: 'Pas tout à fait. La sophrologie est active et progressive : vous apprenez des techniques (respiration, visualisation, détente musculaire) que vous pouvez pratiquer au quotidien. C\'est plus concret et accessible que la méditation traditionnelle.' },
    { question: 'Combien de temps avant de sentir les résultats ?', answer_template: 'Dès la première séance, vous ressentirez une détente. Pour des changements durables (meilleur sommeil, moins de stress), comptez 3-4 séances. L\'efficacité dépend aussi de votre implication.' },
    { question: 'Puis-je pratiquer seule après les séances ?', answer_template: 'Oui, absolument. Je vous enseigne des techniques que vous pouvez reproduire chez vous, idéalement 10-15 minutes par jour. C\'est l\'investissement quotidien qui crée les vrais résultats.' },
  ],
}

// ═══════════════════════════════════════════════
// OSTEOPATHE
// ═══════════════════════════════════════════════
const osteopathe: SpecialtyTemplate = {
  specialty_key: 'osteopathe',
  specialty_label: 'Ostéopathe',

  intention_segments: [
    {
      name: 'Douleur chronique du dos',
      description: 'Personnes souffrant de lombalgies chroniques, sciatalgies ou cervicalgies, souvent après mauvaise posture ou traumatisme.',
      temperature: 'hot',
      media_priority: 'high',
      typical_situations: [
        'Mal de dos depuis des mois ou années',
        'Profession sédentaire (bureau)',
        'Après un accident ou traumatisme',
        'Douleurs qui empêchent les activités quotidiennes',
        'Échec avec d\'autres traitements',
      ],
      keywords_fr: ['mal de dos', 'douleur dos', 'sciatique', 'lombalgie', 'cervicales'],
    },
    {
      name: 'Accompagnement grossesse',
      description: 'Femmes enceintes avec douleurs pelviennes, lombaires ou cherchant préparation à l\'accouchement.',
      temperature: 'warm',
      media_priority: 'high',
      typical_situations: [
        'Douleurs pelviennes pendant la grossesse',
        'Mal de dos aggravé par la grossesse',
        'Nausées et malaises',
        'Préparation du corps pour l\'accouchement',
        'Récupération post-partum',
      ],
      keywords_fr: ['grossesse ostéopathe', 'douleur grossesse', 'préparation accouchement'],
    },
    {
      name: 'Reprise sportive et récupération',
      description: 'Sportifs reprenant après blessure, optimisant performance ou cherchant prévention de blessures.',
      temperature: 'warm',
      media_priority: 'medium',
      typical_situations: [
        'Reprise après blessure ou arrêt',
        'Optimisation de la performance',
        'Prévention de blessures',
        'Récupération après effort intense',
        'Correction de déséquilibres posturaux liés au sport',
      ],
      keywords_fr: ['ostéopathe sportif', 'performance sportive', 'blessure sport', 'préparation athlète'],
    },
    {
      name: 'Tensions posturales bureau/écran',
      description: 'Travailleurs sédentaires avec tensions cervicales, migraines liées à la posture ou fatigue visuelle.',
      temperature: 'cold',
      media_priority: 'medium',
      typical_situations: [
        'Travail d\'écran 8 heures par jour',
        'Tensions cervicales et de l\'épaule',
        'Migraines liées à la posture',
        'Fatigue visuelle',
        'Douleurs après longues journées',
      ],
      keywords_fr: ['posture travail', 'douleur cervicale', 'tension nuque', 'ergonomie'],
    },
    {
      name: 'Suivi nourrissons et bébés',
      description: 'Parents cherchant suivi structurel des nourrissons pour prévention et bien-être optimal.',
      temperature: 'cold',
      media_priority: 'medium',
      typical_situations: [
        'Bébé avec torticolis ou asymétrie',
        'Régurgitations ou coliques',
        'Suivi post-accouchement',
        'Prévention de troubles de la croissance',
        'Optimisation du développement moteur',
      ],
      keywords_fr: ['ostéopathe bébé', 'ostéo nourrisson', 'coliques', 'développement enfant'],
    },
  ],

  hook_templates: [
    { template: 'Vous avez mal au dos depuis des années ? L\'ostéopathie traite la cause, pas juste le symptôme.', angle: 'transformation', segment_match: ['Douleur chronique du dos'] },
    { template: '{pain} vous paralyse. 1 à 3 séances suffisent souvent.', angle: 'urgency', segment_match: ['Douleur chronique du dos', 'Tensions posturales bureau/écran'] },
    { template: 'Enceinte ou jeune mère ? L\'ostéopathie accompagne votre corps à chaque étape.', angle: 'reassurance', segment_match: ['Accompagnement grossesse'] },
    { template: '{number_athletes}% des sportifs de haut niveau consultent un ostéopathe.', angle: 'social_proof', segment_match: ['Reprise sportive et récupération'] },
    { template: 'Votre bébé mérite une structure saine dès le départ.', angle: 'reassurance', segment_match: ['Suivi nourrissons et bébés'] },
    { template: 'L\'ostéopathie : l\'approche globale qui résout les douleurs récurrentes.', angle: 'educational', segment_match: ['Douleur chronique du dos', 'Tensions posturales bureau/écran'] },
  ],

  promise_templates: [
    { template: 'Soulagez votre douleur rapidement, sans médicament, avec une approche structurelle.', proof_type: 'result' },
    { template: 'Une ostéopathie douce et efficace, basée sur l\'anatomie et le bien-être global.', proof_type: 'method' },
    { template: 'Plus de {number_patients} patients soulagés à {city} depuis {number_years} ans.', proof_type: 'experience' },
    { template: 'L\'ostéopathie : reconnue en France depuis {year}, avec formation universitaire d\'excellence.', proof_type: 'method' },
  ],

  objections: [
    { objection: 'L\'ostéopathie, ça craque partout ?', response_template: 'Non, c\'est un cliché. L\'ostéopathie moderne combine plusieurs techniques : manipulations, techniques douces, mobilisations, étirements. Je m\'adapte à votre sensibilité et vos préférences. Les manipulations articulaires sont efficaces mais ne sont pas systématiques.' },
    { objection: 'Ça va soulager, mais le problème va revenir ?', response_template: 'L\'ostéopathie traite la cause du problème, pas juste le symptôme. Après la séance, je vous propose des conseils posturaux, des exercices ou des ajustements ergonomiques pour que la douleur ne revienne pas.' },
    { objection: 'Est-ce que c\'est remboursé ?', response_template: 'L\'ostéopathie n\'est pas remboursée par la Sécurité sociale, mais {percentage}% des mutuelles en France proposent un remboursement partiel. Vérifiez votre couverture.' },
    { objection: 'Combien de séances faut-il ?', response_template: 'Cela dépend du problème. Pour une douleur ponctuelle, 1-2 séances suffisent. Pour une situation chronique, 3-5 séances sont souvent nécessaires, espacées de 2-3 semaines pour laisser le corps s\'adapter.' },
  ],

  campaign_defaults: {
    recommended_objective: 'OUTCOME_LEADS',
    recommended_optimization_event: 'Lead',
    min_daily_budget_cents: 700,
    recommended_daily_budget_cents: 1400,
    recommended_age_min: 20,
    recommended_age_max: 65,
    recommended_radius_km: 15,
    recommended_platforms: ['facebook', 'instagram'],
    learning_period_days: 5,
  },

  faq_templates: [
    { question: 'Comment se déroule une première séance ?', answer_template: 'Je commence par vous écouter : vos douleurs, votre historique, vos habitudes. Puis je procède à un examen approfondi (posture, mobilité, palpation). Enfin, je propose un traitement adapté et vous expliquer ce que j\'ai trouvé.' },
    { question: 'Est-ce que ça va faire mal ?', answer_template: 'Non. L\'ostéopathie peut être douce et non invasive. Je vous demande du retour pour adapter le traitement à votre confort. Après la séance, il est possible de ressentir une légère fatigue passagère — c\'est bon signe.' },
    { question: 'Puis-je venir une seule fois ou faut-il un suivi régulier ?', answer_template: 'Vous pouvez consulter ponctuellement pour une douleur spécifique. Mais pour des problèmes chroniques ou de prévention, un suivi régulier (toutes les 6-8 semaines) est plus bénéfique.' },
  ],
}

// ═══════════════════════════════════════════════
// PSYCHOPRATICIEN
// ═══════════════════════════════════════════════
const psychopraticien: SpecialtyTemplate = {
  specialty_key: 'psychopraticien',
  specialty_label: 'Psychopraticien',

  intention_segments: [
    {
      name: 'Dépression et mal-être',
      description: 'Personnes en dépression, manque de motivation, perte de joie ou sensation de vide existentiel.',
      temperature: 'hot',
      media_priority: 'high',
      typical_situations: [
        'Dépression depuis plusieurs mois',
        'Manque de motivation et d\'énergie',
        'Perte de plaisir (anhedonie)',
        'Pensées négatives récurrentes',
        'Sentiment d\'isolement',
      ],
      keywords_fr: ['dépression', 'mal-être', 'psychothérapie', 'morale basse', 'aller mal'],
    },
    {
      name: 'Thérapie de couple et relationnelle',
      description: 'Couples en crise, conflits récurrents ou cherchant à renforcer leur relation.',
      temperature: 'warm',
      media_priority: 'high',
      typical_situations: [
        'Conflits fréquents et stériles',
        'Manque de communication',
        'Perte d\'intimité physique ou émotionnelle',
        'Infidélité ou trahison',
        'Besoin d\'aide avant séparation',
      ],
      keywords_fr: ['thérapie couple', 'médiation couple', 'relation amoureuse', 'communication'],
    },
    {
      name: 'Accompagnement deuil et perte',
      description: 'Personnes traversant un deuil (décès, séparation, perte d\'identité) et cherchant du soutien.',
      temperature: 'warm',
      media_priority: 'high',
      typical_situations: [
        'Deuil récent d\'un proche',
        'Séparation ou divorce difficile',
        'Perte d\'emploi ou changement majeur',
        'Culpabilité ou regrets',
        'Difficultés à avancer',
      ],
      keywords_fr: ['deuil', 'perte', 'séparation', 'décès', 'accompagnement'],
    },
    {
      name: 'Trauma et PTSD',
      description: 'Personnes ayant vécu trauma (accident, violence, abus) avec symptômes de PTSD.',
      temperature: 'hot',
      media_priority: 'high',
      typical_situations: [
        'Flashbacks ou cauchemars récurrents',
        'Hypervigilance et anxiété',
        'Évitement de certaines situations',
        'Abus physique ou psychologique dans le passé',
        'Accident grave avec séquelles psychologiques',
      ],
      keywords_fr: ['trauma', 'PTSD', 'abus', 'violence', 'choc émotionnel'],
    },
    {
      name: 'Développement personnel et confiance',
      description: 'Personnes cherchant une meilleure compréhension d\'elles-mêmes, construction d\'identité ou croissance personnelle.',
      temperature: 'cold',
      media_priority: 'medium',
      typical_situations: [
        'Quête de sens et d\'identité',
        'Confiance en soi fragile',
        'Préparation à changement majeur',
        'Gestion des relations toxiques',
        'Liberté émotionnelle et autonomie',
      ],
      keywords_fr: ['développement personnel', 'confiance', 'estime', 'croissance', 'psychothérapie'],
    },
  ],

  hook_templates: [
    { template: 'Vous vous sentez seul dans {emotional_state}. Parlons-en dans un espace bienveillant.', angle: 'reassurance', segment_match: ['Dépression et mal-être', 'Accompagnement deuil et perte'] },
    { template: 'Votre relation mérite mieux que le silence. Une thérapie de couple peut sauver votre histoire.', angle: 'transformation', segment_match: ['Thérapie de couple et relationnelle'] },
    { template: '{trauma} vous paralyse encore ? Il existe des techniques éprouvées pour avancer.', angle: 'reassurance', segment_match: ['Trauma et PTSD'] },
    { template: 'Comprendre votre histoire, c\'est reprendre votre vie.', angle: 'educational', segment_match: ['Développement personnel et confiance', 'Dépression et mal-être'] },
    { template: 'Le deuil n\'est pas une maladie. C\'est un chemin. Je l\'accompagne avec vous.', angle: 'reassurance', segment_match: ['Accompagnement deuil et perte'] },
    { template: 'La thérapie ? Un investissement pour le reste de votre vie.', angle: 'transformation', segment_match: ['Développement personnel et confiance'] },
  ],

  promise_templates: [
    { template: 'Un espace de parole bienveillant, sans jugement, pour explorer votre mal-être.', proof_type: 'method' },
    { template: 'Comprendre les racines de vos problèmes et trouver vos propres solutions.', proof_type: 'result' },
    { template: '{number_years} ans d\'accompagnement psychothérapeutique à {city}, {number_patients} patients aidés.', proof_type: 'experience' },
    { template: 'Thérapies validées scientifiquement : TCC, EMDR, psychodynamique adaptée à vos besoins.', proof_type: 'method' },
  ],

  objections: [
    { objection: 'Je vais y aller, parler et ça ne changera rien', response_template: 'La psychothérapie ne consiste pas juste à parler. C\'est un processus de changement progressif. Ensemble, nous identifions les patterns qui vous enferment et explorons de nouvelles façons de penser et d\'agir. Les résultats arrivent progressivement, avec engagement.' },
    { objection: 'J\'ai peur qu\'on me juge', response_template: 'C\'est ma responsabilité professionnelle de créer un espace sans jugement. Le secret médical est absolu. Vous pouvez parler de tout sans crainte — rien ne vous choquera, vous avez ma discrétion totale.' },
    { objection: 'C\'est cher et long', response_template: 'Oui, la thérapie demande un investissement financier et temporel. Mais pensez au coût émotionnel de rester bloqué. Une thérapie courte (8-12 séances) peut déjà créer des changements majeurs. Un accompagnement plus long offre une transformation profonde.' },
    { objection: 'Je n\'ai jamais fait de thérapie, comment ça marche ?', response_template: 'Je vous guide. La première séance est dédiée à créer une relation de confiance et définir ce sur quoi vous aimeriez travailler. Ensuite, nous progressons à votre rythme, à votre demande. Il n\'y a pas de "bonne" façon de faire — juste votre chemin.' },
  ],

  campaign_defaults: {
    recommended_objective: 'OUTCOME_LEADS',
    recommended_optimization_event: 'Lead',
    min_daily_budget_cents: 500,
    recommended_daily_budget_cents: 1000,
    recommended_age_min: 20,
    recommended_age_max: 65,
    recommended_radius_km: 30,
    recommended_platforms: ['facebook'],
    learning_period_days: 5,
  },

  faq_templates: [
    { question: 'Combien de temps dure une thérapie ?', answer_template: 'Cela varie selon votre situation et vos objectifs. Une thérapie brève peut durer 8-12 séances. Un accompagnement plus profond peut s\'étendre sur 6 mois à plusieurs années. Nous évaluons ensemble régulièrement la progression.' },
    { question: 'Qu\'est-ce qui se passe en séance ?', answer_template: 'Vous exprimez librement ce qui vous préoccupe. Je vous écoute sans jugement, puis je peux proposer des perspectives, des techniques ou des réflexions pour avancer. C\'est vraiment un dialogue, votre voix compte.' },
    { question: 'Mes données sont-elles confidentielles ?', answer_template: 'Oui, absolument. Le secret médical s\'applique intégralement. Les seules exceptions légales sont : danger imminent pour vous ou autrui. Sinon, rien de ce que vous me confiez ne sort de mon cabinet.' },
  ],
}

// ═══════════════════════════════════════════════
// COACH DE VIE
// ═══════════════════════════════════════════════
const coach: SpecialtyTemplate = {
  specialty_key: 'coach',
  specialty_label: 'Coach de Vie',

  intention_segments: [
    {
      name: 'Transition professionnelle',
      description: 'Personnes en reconversion, cherchant nouveau métier ou optimisant carrière.',
      temperature: 'warm',
      media_priority: 'high',
      typical_situations: [
        'Besoin de changement professionnel urgent',
        'Reconversion de carrière',
        'Perte d\'emploi ou licenciement',
        'Promotions ou opportunités à saisir',
        'Création d\'entreprise',
      ],
      keywords_fr: ['reconversion professionnelle', 'changement carrière', 'bilan de compétences', 'emploi'],
    },
    {
      name: 'Confiance et assertivité',
      description: 'Personnes manquant de confiance, de caractère affirmé ou d\'autorité personnelle.',
      temperature: 'cold',
      media_priority: 'medium',
      typical_situations: [
        'Prise de parole difficile en réunion',
        'Difficulté à dire "non"',
        'Impuissance face aux autres',
        'Syndrome de l\'imposteur',
        'Besoin de leadership personnel',
      ],
      keywords_fr: ['confiance en soi', 'assertivité', 'leadership', 'affirmation de soi'],
    },
    {
      name: 'Équilibre vie professionnelle / personnelle',
      description: 'Personnes surmenées, cherchant harmonie entre travail et vie privée.',
      temperature: 'warm',
      media_priority: 'medium',
      typical_situations: [
        'Travail envahissant la vie personnelle',
        'Culpabilité permanente',
        'Perte de loisirs et relations',
        'Épuisement émotionnel',
        'Quête de sens au-delà du travail',
      ],
      keywords_fr: ['équilibre vie pro', 'bien-être travail', 'qualité de vie', 'harmonie'],
    },
    {
      name: 'Gestion du temps et productivité',
      description: 'Personnes chronophages, procrastinatrices ou mal organisées.',
      temperature: 'cold',
      media_priority: 'low',
      typical_situations: [
        'Procrastination chronique',
        'Manque d\'organisation',
        'Difficulté à prioriser',
        'Dispersion constante',
        'Manque de discipline personnelle',
      ],
      keywords_fr: ['gestion du temps', 'productivité', 'organisation', 'procrastination'],
    },
  ],

  hook_templates: [
    { template: 'Votre carrière vous paralyse. Changeons ça ensemble en {timeline}.', angle: 'urgency', segment_match: ['Transition professionnelle'] },
    { template: 'Vous méritez une vie où vous ne sacrifiez pas l\'une pour l\'autre.', angle: 'reassurance', segment_match: ['Équilibre vie professionnelle / personnelle'] },
    { template: 'Confiance : c\'est la clé. Et ça s\'apprend.', angle: 'educational', segment_match: ['Confiance et assertivité'] },
    { template: '{number}% de mes clients trouvent un emploi mieux aligné en 3 mois.', angle: 'social_proof', segment_match: ['Transition professionnelle'] },
    { template: 'Vous savez ce que vous voulez. Je vous aide à le faire.', angle: 'transformation', segment_match: ['Confiance et assertivité', 'Transition professionnelle'] },
  ],

  promise_templates: [
    { template: 'Une stratégie claire pour votre transition professionnelle ou votre développement.', proof_type: 'method' },
    { template: 'Des résultats concrets : nouvel emploi, confiance retrouvée, ou équilibre de vie.', proof_type: 'result' },
    { template: '{number_clients} clients coachés, {success_rate}% atteignent leurs objectifs.', proof_type: 'experience' },
  ],

  objections: [
    { objection: 'Le coaching, c\'est pour qui ?', response_template: 'C\'est pour toute personne qui veut progresser, que ce soit professionnellement ou personnellement. Vous n\'avez pas besoin d\'avoir un gros problème — juste l\'envie d\'avancer.' },
    { objection: 'Ça va vraiment changer ma vie ?', response_template: 'Le coaching ne change pas votre vie, VOUS le faites. Je suis un guide : je vous aide à clarifier vos objectifs, à identifier blocages, et à passer à l\'action. Les changements dépendent de votre engagement.' },
    { objection: 'C\'est cher', response_template: 'Un coaching d\'excellence requiert un investissement. Pensez à ce qu\'un changement professionnel ou personnel vous apporte : plus de salaire, meilleure santé, relations plus saines. Le ROI est très positif.' },
  ],

  campaign_defaults: {
    recommended_objective: 'OUTCOME_LEADS',
    recommended_optimization_event: 'Lead',
    min_daily_budget_cents: 600,
    recommended_daily_budget_cents: 1200,
    recommended_age_min: 25,
    recommended_age_max: 55,
    recommended_radius_km: 50,
    recommended_platforms: ['facebook', 'instagram', 'linkedin'],
    learning_period_days: 4,
  },

  faq_templates: [
    { question: 'Combien de séances pour voir des résultats ?', answer_template: 'Les premiers résultats (clarté, énergie, action) arrivent dès la première séance. Mais un vrai changement demande généralement 8-12 séances, étalées sur 2-3 mois.' },
    { question: 'Quelle est la différence avec la thérapie ?', answer_template: 'La thérapie examine le passé pour guérir. Le coaching regarde le futur pour créer. Je suis tourné vers l\'action et les solutions, pas l\'exploration du trauma.' },
    { question: 'Pouvez-vous vraiment m\'aider pour ma carrière ?', answer_template: 'Oui. J\'ai accompagné des dizaines de personnes en reconversion. Je vous aide à clarifier vos forces, à définir un plan, et à passer à l\'action — de la recherche d\'emploi au leadership.' },
  ],
}

// ═══════════════════════════════════════════════
// NATUROPATHE
// ═══════════════════════════════════════════════
const naturopathe: SpecialtyTemplate = {
  specialty_key: 'naturopathe',
  specialty_label: 'Naturopathe',

  intention_segments: [
    {
      name: 'Problèmes digestifs',
      description: 'Personnes avec troubles digestifs chroniques (ballonnements, constipation, reflux, IBS...) cherchant cause profonde.',
      temperature: 'warm',
      media_priority: 'high',
      typical_situations: [
        'Ballonnements chroniques et inconfortables',
        'Constipation ou diarrhée récurrente',
        'Reflux gastrique',
        'Intolérances alimentaires',
        'Après antibiotiques ou déséquilibre intestinal',
      ],
      keywords_fr: ['problèmes digestifs', 'constipation', 'ballonnements', 'santé intestinale', 'ibs'],
    },
    {
      name: 'Fatigue chronique',
      description: 'Personnes épuisées, manquant d\'énergie malgré repos, cherchant cause naturopathique.',
      temperature: 'warm',
      media_priority: 'high',
      typical_situations: [
        'Fatigue permanente malgré sommeil',
        'Fatigue post-infectieuse',
        'Burn-out ou surmenage chronique',
        'Manque d\'énergie pour activités quotidiennes',
        'Perte d\'intérêt général pour la vie',
      ],
      keywords_fr: ['fatigue chronique', 'épuisement', 'énergie', 'vitalité', 'asthénie'],
    },
    {
      name: 'Immunité et prévention',
      description: 'Personnes cherchant renforcer immunité, prévenir maladies ou récidive.',
      temperature: 'cold',
      media_priority: 'medium',
      typical_situations: [
        'Infections fréquentes (rhumes, angines)',
        'Après période débilitante',
        'Peur de maladie grave',
        'Vieillissement et fragilité',
        'Prévention avant saison hivernale',
      ],
      keywords_fr: ['immunité', 'système immunitaire', 'prévention', 'santé naturelle'],
    },
    {
      name: 'Alimentation saine et rééquilibrage',
      description: 'Personnes cherchant manger mieux, équilibré ou gérer relations à nourriture.',
      temperature: 'cold',
      media_priority: 'medium',
      typical_situations: [
        'Besoin de rééquilibrer alimentation',
        'Alimentation ultra-transformée',
        'Prise de poids progressive',
        'Défaut nutritionnel',
        'Relation conflictuelle à nourriture',
      ],
      keywords_fr: ['alimentation saine', 'nutrition', 'régime', 'santé par alimentation'],
    },
    {
      name: 'Détox et perte de poids naturelle',
      description: 'Personnes cherchant détoxifier corps ou perdre poids de façon naturelle et durable.',
      temperature: 'warm',
      media_priority: 'medium',
      typical_situations: [
        'Accumulation de toxines',
        'Après période d\'abus (alcool, malbouffe)',
        'Perte de poids naturelle et durable',
        'Détox avant changement de saison',
        'Cure de rajeunissement',
      ],
      keywords_fr: ['détox', 'perte de poids naturelle', 'nettoyage corps', 'détoxification'],
    },
  ],

  hook_templates: [
    { template: 'Vos {digestive_problem} viennent de ce que vous mangez. Changeons ça ensemble.', angle: 'educational', segment_match: ['Problèmes digestifs', 'Alimentation saine et rééquilibrage'] },
    { template: 'Fatigue depuis des mois ? Cherchons la vraie cause avec la naturopathie.', angle: 'transformation', segment_match: ['Fatigue chronique'] },
    { template: 'Renforcez votre immunité naturellement avant l\'hiver.', angle: 'urgency', segment_match: ['Immunité et prévention'] },
    { template: '{number}% de mes patients retrouvent énergie et vitalité en 4-6 semaines.', angle: 'social_proof', segment_match: ['Fatigue chronique'] },
    { template: 'Perdre du poids naturellement ? Sans régime restrictif, c\'est possible.', angle: 'transformation', segment_match: ['Détox et perte de poids naturelle'] },
    { template: 'Votre corps sait se guérir. La naturopathie l\'active.', angle: 'educational', segment_match: ['Problèmes digestifs', 'Immunité et prévention', 'Fatigue chronique'] },
  ],

  promise_templates: [
    { template: 'Un diagnostic complet des dérèglements de votre corps et un plan de rééquilibrage naturel.', proof_type: 'method' },
    { template: 'Retrouvez digestion, énergie et vitalité en suivant des conseils pratiques et naturels.', proof_type: 'result' },
    { template: '{number_years} ans d\'accompagnement naturopathique à {city}, {number_clients} clients transformés.', proof_type: 'experience' },
    { template: 'Approche holistique basée sur nutrition, plantes et hygiène de vie — sans dogme.', proof_type: 'method' },
  ],

  objections: [
    { objection: 'La naturopathie, c\'est pas scientifique ?', response_template: 'La naturopathie s\'appuie sur l\'hygiène de vie, la nutrition et la phytothérapie — domaines avec données scientifiques solides. Je m\'éduque constamment. Je ne peux pas traiter des maladies graves, mais je peux vous aider à prévenir et optimiser votre santé.' },
    { objection: 'Je ne fais pas de régime', response_template: 'Ce n\'est pas un régime. C\'est un rééquilibrage alimentaire qui devient naturel avec le temps. Vous apprenez ce qui fonctionne pour VOTRE corps, pas une formule universelle.' },
    { objection: 'Les suppléments, ça coûte cher ?', response_template: 'Oui, initialement. Mais une bonne supplémentation ciblée coûte moins que les dépenses médicales et pharmaceutiques à long terme. C\'est un investissement en prévention.' },
    { objection: 'Combien de temps pour voir les résultats ?', response_template: 'Cela dépend du problème. Les problèmes digestifs peuvent s\'améliorer en 2-3 semaines. La fatigue chronique demande généralement 4-6 semaines de suivi. La clé est la régularité et l\'adhérence au plan.' },
  ],

  campaign_defaults: {
    recommended_objective: 'OUTCOME_LEADS',
    recommended_optimization_event: 'Lead',
    min_daily_budget_cents: 600,
    recommended_daily_budget_cents: 1300,
    recommended_age_min: 30,
    recommended_age_max: 60,
    recommended_radius_km: 25,
    recommended_platforms: ['facebook', 'instagram'],
    learning_period_days: 5,
  },

  faq_templates: [
    { question: 'Comment se déroule une première consultation ?', answer_template: 'J\'effectue un bilan complet : antécédents, alimentation, hygiène de vie, symptômes. Puis un questionnaire détaillé. Enfin, je propose un plan naturopathique personnalisé avec alimentation, suppléments et conseils lifestyle.' },
    { question: 'La naturopathie remplace-t-elle le médecin ?', answer_template: 'Non, je ne diagnostique pas et ne traite pas les maladies. Je complète votre suivi médical avec une approche préventive et optimisatrice. Pour les pathologies, votre médecin reste référent.' },
    { question: 'Vais-je devoir tout changer du jour au lendemain ?', answer_template: 'Non. Un changement progressif est plus durable. Je vous aide à changer une habitude à la fois, à votre rythme, sans frustration. C\'est sur 4-8 semaines que vous voyez la transformation.' },
  ],
}

// ═══════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════

export const SPECIALTY_TEMPLATES: Record<string, SpecialtyTemplate> = {
  hypnotherapeute,
  sophrologue,
  osteopathe,
  psychopraticien,
  coach,
  naturopathe,
}

// Get template for a specialty, with fallback
export function getSpecialtyTemplate(specialtyKey: string): SpecialtyTemplate | null {
  if (!specialtyKey) return null
  return SPECIALTY_TEMPLATES[specialtyKey.toLowerCase()] || null
}

// Get all available specialties
export function getAvailableSpecialties(): Array<{ key: string; label: string }> {
  return Object.values(SPECIALTY_TEMPLATES).map(t => ({
    key: t.specialty_key,
    label: t.specialty_label,
  }))
}
