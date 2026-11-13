/* ==========================================================================
   FACE CLINIC ODONTOLOGIA & SAÚDE — CONFIGURAÇÃO CENTRAL DO SITE
   --------------------------------------------------------------------------
   Tudo o que muda de um cliente para outro está aqui: contatos, endereço,
   mensagens de WhatsApp, tratamentos, diferenciais, jornada, galeria,
   avaliações e perguntas frequentes.

   Regras:
   • Campos `null` ou listas vazias ficam OCULTOS no site.
   • Preencha apenas com informações confirmadas pelo consultório.
   • Depois de editar, salve e recarregue a página.
   ========================================================================== */

window.SITE_CONFIG = {
  clinic: {
    name: 'Face Clinic',
    fullName: 'Face Clinic Odontologia & Saúde',
    legalName: 'Face Clinic Odontologia e Saúde Ltda',
    tagline: 'Odontologia & Saúde',
    audience: 'Adultos e crianças', // "tratamentos para adultos e crianças (odontopediatria)"
  },

  professional: {
    name: 'Dr. José Carlos Fiamenghi Jr.',
    title: 'Cirurgião-dentista',
    role: 'Responsável técnico',
    cro: 'CRO/SC 11053',
  },

  // Números publicados na bio oficial do Instagram (@odontofaceclinic).
  // Remova qualquer item que o consultório prefira não divulgar.
  stats: [
    { value: 23, prefix: '+', suffix: '', label: 'anos de atuação' },
    { value: 8, prefix: '+', suffix: ' mil', label: 'pacientes atendidos' },
  ],

  contact: {
    // Número no formato internacional, só dígitos (usado no link wa.me).
    // Conferido no Perfil da Empresa no Google: (47) 99618-8834.
    // Se o link não abrir a conversa, teste o formato informado no briefing: '554796188834'.
    whatsapp: { number: '5547996188834', display: '(47) 99618-8834' },
    // Telefone fixo/ligação. Deixe null enquanto não houver número confirmado.
    phone: null, // ex.: { number: '+554700000000', display: '(47) 0000-0000' }
    email: 'odontologia.com@yahoo.com',
    instagram: {
      handle: '@odontofaceclinic',
      url: 'https://www.instagram.com/odontofaceclinic',
    },
  },

  // Mensagens pré-preenchidas no WhatsApp ({tratamento} é substituído automaticamente).
  messages: {
    schedule: 'Olá! Encontrei seu site e gostaria de agendar uma consulta.',
    emergency:
      'Olá! Preciso de atendimento odontológico de urgência. Poderia me orientar sobre a disponibilidade?',
    treatment: 'Olá! Encontrei seu site e gostaria de agendar uma consulta sobre {tratamento}.',
  },

  address: {
    // Briefing: "Rua João de Deus Carvalho 5000". No Google, a clínica aparece como
    // "R. 5000 - João de Deus Carvalho, 2175" (5000 é o nome da rua; 2175 é o número).
    street: 'Rua 5000 – João de Deus Carvalho, 2175',
    complement: null, // ex.: 'Sala 2'
    district: null, // bairro, quando confirmado
    city: 'Balneário Piçarras',
    state: 'SC',
    zip: '88380-000',
    country: 'Brasil',
    // Busca do Google Maps (link "Ver localização" e mapa incorporado).
    // Este texto abre direto o perfil da clínica no Google.
    mapsQuery: 'Face Clinic Odontologia & Saúde - Dr. Jose Carlos Fiamenghi Jr, R. 5000 - João de Deus Carvalho, 2175, Balneário Piçarras - SC',
  },

  // Horários confirmados. Enquanto vazio, o site orienta a consultar pelo WhatsApp.
  hours: [
    // { days: 'Segunda a sexta', time: '08h às 18h' },
  ],

  emergency: {
    available: true, // "atendimento de urgência e emergência" — descrição oficial do Google
    is24h: false, // só marque true com confirmação do consultório
  },

  hero: {
    // Vídeo institucional opcional. Quando existir, substitui o retrato no fundo da hero.
    // ex.: { mp4: 'assets/video/hero.mp4', webm: null, poster: 'assets/img/dr-jose-carlos.jpg' }
    video: null,
  },

  // Tratamentos listados na descrição oficial do consultório (Perfil da Empresa no Google).
  // `topic` é o trecho usado na mensagem de WhatsApp. `image` é opcional.
  treatments: [
    {
      name: 'Implantes dentários',
      topic: 'implantes dentários',
      description:
        'Reposição de dentes perdidos com implantes, planejada a partir de uma avaliação individual e acompanhada em cada etapa.',
      image: null,
    },
    {
      name: 'Próteses dentárias',
      topic: 'próteses dentárias',
      description:
        'Reabilitação com próteses, indicadas conforme a necessidade de cada paciente, para devolver conforto à mastigação e ao sorriso.',
      image: null,
    },
    {
      name: 'Ortodontia',
      topic: 'ortodontia',
      description:
        'Correção do posicionamento dos dentes e da mordida, com planejamento e acompanhamento ao longo de todo o tratamento.',
      image: null,
    },
    {
      name: 'Endodontia',
      note: 'Tratamento de canal',
      topic: 'tratamento de canal',
      description:
        'Tratamento de canal para cuidar da parte interna do dente e preservar o dente natural sempre que possível.',
      image: null,
    },
    {
      name: 'Periodontia',
      topic: 'periodontia',
      description:
        'Cuidado com a gengiva e com os tecidos que sustentam os dentes, da prevenção ao tratamento.',
      image: null,
    },
    {
      name: 'Odontologia estética',
      note: 'Facetas, lentes e clareamento',
      topic: 'odontologia estética',
      description:
        'Facetas, lentes de contato dental e clareamento, sempre a partir de uma avaliação criteriosa do seu sorriso.',
      image: null,
    },
    {
      name: 'Clínica geral',
      topic: 'clínica geral',
      description:
        'Consultas de rotina, diagnóstico e acompanhamento da saúde bucal para todas as idades.',
      image: null,
    },
    {
      name: 'Odontopediatria',
      topic: 'odontopediatria',
      description:
        'Atendimento odontológico para crianças, com acolhimento, paciência e orientação para toda a família.',
      image: null,
    },
    {
      name: 'Restaurações',
      topic: 'restaurações',
      description: 'Recuperação de dentes afetados por cáries, fraturas ou desgastes.',
      image: null,
    },
    {
      name: 'Limpeza e prevenção',
      topic: 'limpeza e prevenção',
      description:
        'Limpezas preventivas e orientações de higiene para manter a saúde bucal em dia.',
      image: null,
    },
    {
      name: 'Extrações',
      topic: 'extrações',
      description:
        'Extrações dentárias, incluindo dentes do siso, com planejamento e orientações para a recuperação.',
      image: null,
    },
    {
      name: 'Urgência e emergência',
      kind: 'emergency', // usa a mensagem de urgência
      description:
        'Atendimento para dor, trauma ou imprevistos. Entre em contato para receber orientações sobre a disponibilidade.',
      image: null,
    },
  ],

  differentials: [
    {
      title: 'Atenção individualizada',
      text: 'Cada paciente é ouvido com calma, para que o cuidado parta das suas necessidades e expectativas.',
    },
    {
      title: 'Planejamento do atendimento',
      text: 'Cada etapa é explicada com clareza antes de começar, para que você entenda o caminho do tratamento.',
    },
    {
      title: 'Para toda a família',
      text: 'Atendimento para adultos e crianças, com a mesma atenção em cada fase da vida.',
    },
    {
      title: 'Acolhimento e orientação',
      text: 'Orientações claras antes e depois de cada procedimento, para você se sentir seguro em todo o percurso.',
    },
  ],

  journey: [
    {
      title: 'Primeiro contato',
      text: 'Entre em contato para obter informações e solicitar seu agendamento.',
    },
    {
      title: 'Avaliação',
      text: 'Um momento dedicado à compreensão das suas necessidades odontológicas.',
    },
    {
      title: 'Planejamento',
      text: 'As possibilidades de cuidado são discutidas conforme a avaliação profissional.',
    },
    {
      title: 'Acompanhamento',
      text: 'Orientações e acompanhamento conforme as necessidades do tratamento.',
    },
  ],

  // Galeria do consultório. Coloque as fotos em assets/img/consultorio/ e
  // preencha `src` (ex.: 'assets/img/consultorio/recepcao.webp').
  // Enquanto `src` for null, o espaço aparece como moldura elegante.
  gallery: [
    { src: null, alt: 'Recepção da Face Clinic', caption: 'Recepção' },
    { src: null, alt: 'Consultório de atendimento da Face Clinic', caption: 'Consultório' },
    { src: null, alt: 'Detalhes do ambiente da Face Clinic', caption: 'Detalhes' },
    { src: null, alt: 'Ambiente de atendimento da Face Clinic', caption: 'Ambiente' },
  ],

  // Avaliações públicas reais (Google). Trechos sem alteração de sentido.
  // Antes de publicar, confirme se a divulgação segue as normas do CFO/CRO-SC.
  // Para ocultar a seção, use enabled: false.
  reviews: {
    enabled: true,
    sourceLabel: 'Google',
    sourceUrl:
      'https://www.google.com/maps/search/?api=1&query=Face%20Clinic%20Odontologia%20%26%20Sa%C3%BAde%20-%20Dr.%20Jose%20Carlos%20Fiamenghi%20Jr%2C%20R.%205000%20-%20Jo%C3%A3o%20de%20Deus%20Carvalho%2C%202175%2C%20Balne%C3%A1rio%20Pi%C3%A7arras%20-%20SC',
    items: [
      {
        author: 'Nycolle A.',
        text: 'Ambiente limpo, organizado e super acolhedor. A equipe é muito atenciosa e os profissionais passam muita confiança e cuidado em cada detalhe.',
      },
      {
        author: 'Janaina B.',
        text: 'Quero registrar meu agradecimento ao Dr. José e à Lizi pela excelência no atendimento. Vocês dois transformaram completamente a minha experiência no consultório — algo que antes era sinônimo de medo, hoje se tornou confiança.',
      },
      {
        author: 'Dione B.',
        text: 'Excelente atendimento. O Dr. José é um excelente profissional. Nos transmite segurança e qualidade no atendimento e após. Nos orienta no procedimento e após o mesmo.',
      },
    ],
  },

  // Perguntas frequentes. Atalhos aceitos nas respostas:
  // {whatsapp} {instagram} {endereco} {horarios}
  faq: [
    {
      q: 'Como posso agendar uma consulta?',
      a: 'Você pode agendar diretamente pelo WhatsApp {whatsapp} ou enviar uma mensagem pelo Instagram {instagram}. É só contar o que você precisa.',
    },
    {
      q: 'Onde fica o consultório?',
      a: 'O consultório fica na {endereco}. Use o botão “Ver localização” para abrir a rota no Google Maps.',
    },
    {
      q: 'Qual é o horário de atendimento?',
      a: '{horarios}',
    },
    {
      q: 'Existe atendimento de urgência?',
      a: 'Sim. A Face Clinic oferece atendimento de urgência e emergência odontológica. Entre em contato pelo WhatsApp para receber orientações sobre a disponibilidade.',
    },
    {
      q: 'Vocês atendem crianças?',
      a: 'Sim. O consultório atende adultos e crianças, incluindo atendimento de odontopediatria.',
    },
    {
      q: 'Como posso saber quais tratamentos são indicados para mim?',
      a: 'A indicação depende de uma avaliação odontológica individualizada. Na consulta, suas necessidades são avaliadas e as possibilidades de cuidado são apresentadas para o seu caso.',
    },
  ],
};
