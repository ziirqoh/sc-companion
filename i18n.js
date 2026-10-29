// SC Companion — translations (English, French, German, Spanish).
//
// The page and the scripts are written in English. This file swaps visible text for the
// chosen language as it appears, so the rest of the code doesn't need to know about languages.
// Each row of STRINGS is [English, French, German, Spanish]. In a row, {0}, {1}… stand for any
// text (it's translated too, if it can be) and {n}, {n2}… for a number. Text with no exact
// match is tried against those patterns, then split on " · " and on sentences.
// Names of places, commodities and ships stay in English, as they are in the game.

const LANG_KEY = 'sc-companion-lang';
const LANGS = ['en', 'fr', 'de', 'es'];

const STRINGS = [
  // ---------- header and navigation ----------
  ['Your Star Citizen helper', 'Votre assistant Star Citizen', 'Dein Star-Citizen-Helfer', 'Tu asistente de Star Citizen'],
  ['Loading…', 'Chargement…', 'Wird geladen…', 'Cargando…'],
  ['Refreshing…', 'Actualisation…', 'Wird aktualisiert…', 'Actualizando…'],
  ['Data from {0}', 'Données de {0}', 'Daten von {0}', 'Datos de las {0}'],
  ['Last refresh failed: {0}', 'Échec de la dernière mise à jour : {0}', 'Letzte Aktualisierung fehlgeschlagen: {0}', 'Falló la última actualización: {0}'],
  ['· next update in {0}', '· prochaine mise à jour dans {0}', '· nächstes Update in {0}', '· próxima actualización en {0}'],
  ['· update due, checking…', '· mise à jour attendue, vérification…', '· Update fällig, wird geprüft…', '· actualización pendiente, comprobando…'],
  ['↻ Refresh', '↻ Actualiser', '↻ Aktualisieren', '↻ Actualizar'],
  ['Fetch the latest data now', 'Récupérer les dernières données maintenant', 'Jetzt die neuesten Daten abrufen', 'Obtener ahora los datos más recientes'],
  ['Wait a minute between manual refreshes.', 'Attendez une minute entre deux actualisations manuelles.', 'Warte eine Minute zwischen manuellen Aktualisierungen.', 'Espera un minuto entre actualizaciones manuales.'],
  ['Fetched by the server every 15 minutes, even when nobody has the site open', 'Récupérées par le serveur toutes les 15 minutes, même quand personne n’a le site ouvert', 'Vom Server alle 15 Minuten abgerufen, auch wenn niemand die Seite geöffnet hat', 'Las obtiene el servidor cada 15 minutos, aunque nadie tenga el sitio abierto'],
  ['Fetched by your browser directly from UEX', 'Récupérées par votre navigateur directement depuis UEX', 'Von deinem Browser direkt bei UEX abgerufen', 'Las obtiene tu navegador directamente de UEX'],
  ['☀ Light', '☀ Clair', '☀ Hell', '☀ Claro'],
  ['☾ Dark', '☾ Sombre', '☾ Dunkel', '☾ Oscuro'],
  ['Switch between dark and light', 'Basculer entre thème sombre et clair', 'Zwischen dunkel und hell wechseln', 'Cambiar entre tema oscuro y claro'],
  ['Language', 'Langue', 'Sprache', 'Idioma'],
  ['Home', 'Accueil', 'Start', 'Inicio'],
  ['Trade Companion', 'Compagnon de commerce', 'Handelsbegleiter', 'Compañero de comercio'],
  ['Salvage Companion', 'Compagnon de récupération', 'Bergungsbegleiter', 'Compañero de chatarrería'],

  // ---------- front page ----------
  ['Welcome to SC Companion', 'Bienvenue sur SC Companion', 'Willkommen bei SC Companion', 'Bienvenido a SC Companion'],
  ["Tools that help you understand Star Citizen's economy: what to buy, where to sell it, and what every shop has in stock. Prices come from player reports and refresh every 15 minutes.",
    'Des outils pour comprendre l’économie de Star Citizen : quoi acheter, où le revendre et ce que chaque boutique a en stock. Les prix viennent des relevés des joueurs et sont actualisés toutes les 15 minutes.',
    'Werkzeuge, die dir die Wirtschaft von Star Citizen erklären: was du kaufen solltest, wo du es verkaufst und was jeder Shop auf Lager hat. Die Preise stammen aus Spielermeldungen und werden alle 15 Minuten aktualisiert.',
    'Herramientas para entender la economía de Star Citizen: qué comprar, dónde venderlo y qué tiene cada tienda en stock. Los precios vienen de los reportes de jugadores y se actualizan cada 15 minutos.'],
  ['commodities tracked', 'marchandises suivies', 'Waren erfasst', 'mercancías seguidas'],
  ['trade terminals', 'terminaux de commerce', 'Handelsterminals', 'terminales de comercio'],
  ['prices & stock levels', 'prix et niveaux de stock', 'Preise & Lagerstände', 'precios y niveles de stock'],
  ['reported in the last 24 h', 'relevés ces dernières 24 h', 'in den letzten 24 h gemeldet', 'reportados en las últimas 24 h'],
  ['Open Trade Companion →', 'Ouvrir le Compagnon de commerce →', 'Handelsbegleiter öffnen →', 'Abrir el Compañero de comercio →'],
  ['Open Salvage Companion →', 'Ouvrir le Compagnon de récupération →', 'Bergungsbegleiter öffnen →', 'Abrir el Compañero de chatarrería →'],
  ['Choose where you are. See what the shop sells, its stock, and the best place to sell each item.',
    'Choisissez où vous êtes. Voyez ce que vend la boutique, son stock et le meilleur endroit où revendre chaque article.',
    'Wähle deinen Standort. Sieh, was der Shop verkauft, seinen Bestand und wo du jede Ware am besten verkaufst.',
    'Elige dónde estás. Mira qué vende la tienda, su stock y el mejor lugar para vender cada artículo.'],
  ['Enter how much you want to invest and your cargo space. Get what to buy, where to buy it, and where to sell it.',
    'Indiquez combien vous voulez investir et votre espace de soute. Obtenez quoi acheter, où l’acheter et où le revendre.',
    'Gib an, wie viel du investieren willst und deinen Frachtraum. Erfahre, was du wo kaufst und wo du es verkaufst.',
    'Indica cuánto quieres invertir y tu espacio de carga. Descubre qué comprar, dónde comprarlo y dónde venderlo.'],
  ['Every tradeable commodity with its risks, cheapest buy, best sell and max margin. Sort by any column.',
    'Toutes les marchandises échangeables avec leurs risques, le meilleur achat, la meilleure vente et la marge max. Triez par n’importe quelle colonne.',
    'Jede handelbare Ware mit Risiken, günstigstem Einkauf, bestem Verkauf und maximaler Marge. Nach jeder Spalte sortierbar.',
    'Todas las mercancías comerciables con sus riesgos, la compra más barata, la mejor venta y el margen máximo. Ordena por cualquier columna.'],
  ['Biggest margin right now:', 'Plus grosse marge en ce moment :', 'Größte Marge gerade:', 'Mayor margen ahora mismo:'],
  ['At {0}:', 'À {0} :', 'In {0}:', 'En {0}:'],
  ['buy {n} SCU', 'achetez {n} SCU de', 'kaufe {n} SCU', 'compra {n} SCU de'],
  ['for {0}, sell at {1},', 'à {0}, revendez à {1},', 'für {0}, verkaufe in {1},', 'a {0}, vende en {1},'],
  ['from {0} to {1},', 'de {0} à {1},', 'von {0} nach {1},', 'de {0} a {1},'],
  ['Enter how much RMC and Construction Materials you carry. See where to sell them for the most aUEC, all at one stop or material by material.',
    'Indiquez combien de RMC et de Construction Materials vous transportez. Voyez où les vendre au meilleur prix, en un seul arrêt ou matériau par matériau.',
    'Gib an, wie viel RMC und Construction Materials du dabeihast. Sieh, wo du am meisten aUEC bekommst, an einem Ort oder Material für Material.',
    'Indica cuánto RMC y Construction Materials llevas. Mira dónde venderlos por más aUEC, en una sola parada o material por material.'],
  ['Best prices now:', 'Meilleurs prix actuels :', 'Beste Preise gerade:', 'Mejores precios ahora:'],
  ['RMC up to', 'RMC jusqu’à', 'RMC bis zu', 'RMC hasta'],
  ['Construction Mat. up to', 'Construction Mat. jusqu’à', 'Construction Mat. bis zu', 'Construction Mat. hasta'],
  ['Every salvage ship, from the Salvation to the Reclaimer: capacity, crew, what it can break apart, and a step-by-step guide to using it.',
    'Chaque vaisseau de récupération, du Salvation au Reclaimer : capacité, équipage, ce qu’il peut démanteler, et un guide pas à pas pour l’utiliser.',
    'Jedes Bergungsschiff, von der Salvation bis zum Reclaimer: Kapazität, Crew, was es zerlegen kann, und eine Schritt-für-Schritt-Anleitung.',
    'Cada nave de chatarrería, de la Salvation a la Reclaimer: capacidad, tripulación, qué puede desguazar y una guía paso a paso para usarla.'],
  ['{n} ships.', '{n} vaisseaux.', '{n} Schiffe.', '{n} naves.'],
  ['A full Reclaimer of RMC ≈', 'Un Reclaimer plein de RMC ≈', 'Ein voller Reclaimer mit RMC ≈', 'Una Reclaimer llena de RMC ≈'],
  ["How salvage works, how to take and finish salvage contracts, what's legal, and how to turn wrecks into aUEC.",
    'Comment fonctionne la récupération, comment prendre et terminer les contrats, ce qui est légal, et comment transformer les épaves en aUEC.',
    'Wie Bergung funktioniert, wie du Bergungsaufträge annimmst und abschließt, was legal ist und wie du Wracks zu aUEC machst.',
    'Cómo funciona la chatarrería, cómo aceptar y completar contratos, qué es legal y cómo convertir restos en aUEC.'],
  ["Start here if you've never salvaged.", 'Commencez ici si vous n’avez jamais fait de récupération.', 'Fang hier an, wenn du noch nie geborgen hast.', 'Empieza aquí si nunca has hecho chatarrería.'],
  ['Safe to use', 'Sans risque', 'Sicher zu benutzen', 'Seguro de usar'],
  ["SC Companion is a normal website. It never connects to, reads or modifies the game, so using it can't get your account banned.",
    'SC Companion est un site web normal. Il ne se connecte jamais au jeu, ne le lit pas et ne le modifie pas : l’utiliser ne peut pas faire bannir votre compte.',
    'SC Companion ist eine normale Website. Sie verbindet sich nie mit dem Spiel, liest oder verändert es nicht, daher kann dein Konto deswegen nicht gesperrt werden.',
    'SC Companion es una web normal. Nunca se conecta al juego, ni lo lee ni lo modifica, así que usarla no puede hacer que baneen tu cuenta.'],

  // ---------- Trade: sub-navigation ----------
  ['Sell Finder', 'Où vendre', 'Verkaufsfinder', 'Buscador de ventas'],
  ['Best Routes', 'Meilleures routes', 'Beste Routen', 'Mejores rutas'],
  ['Commodity Guide', 'Guide des marchandises', 'Warenführer', 'Guía de mercancías'],

  // ---------- Sell Finder ----------
  ["Choose where you are. You'll see what this shop sells right now, its price and stock, and where to sell each item for the most profit. Click a row for every sell location and its 24 h stock history.",
    'Choisissez où vous êtes. Vous verrez ce que cette boutique vend en ce moment, son prix et son stock, et où revendre chaque article avec le plus de profit. Cliquez sur une ligne pour voir tous les lieux de vente et l’historique de stock sur 24 h.',
    'Wähle deinen Standort. Du siehst, was dieser Shop gerade verkauft, Preis und Bestand, und wo du jede Ware mit dem meisten Gewinn verkaufst. Klicke auf eine Zeile für alle Verkaufsorte und den Bestandsverlauf der letzten 24 h.',
    'Elige dónde estás. Verás qué vende esta tienda ahora, su precio y stock, y dónde vender cada artículo con más beneficio. Haz clic en una fila para ver todos los lugares de venta y el historial de stock de 24 h.'],
  ['Your location', 'Votre position', 'Dein Standort', 'Tu ubicación'],
  ['Cargo space (SCU)', 'Espace de soute (SCU)', 'Frachtraum (SCU)', 'Espacio de carga (SCU)'],
  ['Budget (aUEC, optional)', 'Budget (aUEC, facultatif)', 'Budget (aUEC, optional)', 'Presupuesto (aUEC, opcional)'],
  ['Sort by', 'Trier par', 'Sortieren nach', 'Ordenar por'],
  ['Total profit (your cargo)', 'Profit total (votre cargaison)', 'Gesamtgewinn (deine Ladung)', 'Beneficio total (tu carga)'],
  ['Profit per SCU', 'Profit par SCU', 'Gewinn pro SCU', 'Beneficio por SCU'],
  ['Sell in other star systems', 'Vendre dans d’autres systèmes', 'In anderen Sternsystemen verkaufen', 'Vender en otros sistemas'],
  ['You are at', 'Vous êtes à', 'Du bist in', 'Estás en'],
  ['Shop', 'Boutique', 'Shop', 'Tienda'],
  ['{n} goods for sale', '{n} marchandises en vente', '{n} Waren im Angebot', '{n} mercancías a la venta'],
  ['Max box {n} SCU', 'Caisse max {n} SCU', 'Max. Kiste {n} SCU', 'Caja máx. {n} SCU'],
  ['Max box —', 'Caisse max —', 'Max. Kiste —', 'Caja máx. —'],
  ['max box {n} SCU', 'caisse max {n} SCU', 'max. Kiste {n} SCU', 'caja máx. {n} SCU'],
  ['Loading dock', 'Quai de chargement', 'Laderampe', 'Muelle de carga'],
  ['Freight elevator', 'Monte-charge', 'Lastenaufzug', 'Montacargas'],
  ['Refuel', 'Ravitaillement', 'Tanken', 'Repostaje'],
  ['Repair', 'Réparation', 'Reparatur', 'Reparación'],
  ['No questions asked', 'Sans questions', 'Keine Fragen', 'Sin preguntas'],
  ['no questions asked', 'sans questions', 'keine Fragen', 'sin preguntas'],
  ['Best buy here for {n} SCU', 'Meilleur achat ici pour {n} SCU', 'Bester Kauf hier für {n} SCU', 'Mejor compra aquí para {n} SCU'],
  ['{0} aUEC profit', '{0} aUEC de profit', '{0} aUEC Gewinn', '{0} aUEC de beneficio'],
  ['for {0} invested', 'pour {0} investis', 'bei {0} Einsatz', 'invirtiendo {0}'],
  ['This shop has no goods for sale.', 'Cette boutique n’a rien à vendre.', 'Dieser Shop hat nichts im Angebot.', 'Esta tienda no tiene nada a la venta.'],
  ['For sale here', 'En vente ici', 'Hier im Angebot', 'A la venta aquí'],
  ['Buy price / SCU', 'Prix d’achat / SCU', 'Kaufpreis / SCU', 'Precio de compra / SCU'],
  ['In stock (SCU)', 'En stock (SCU)', 'Auf Lager (SCU)', 'En stock (SCU)'],
  ['Stock level', 'Niveau de stock', 'Lagerstand', 'Nivel de stock'],
  ['24 h stock', 'Stock 24 h', 'Bestand 24 h', 'Stock 24 h'],
  ['Best place to sell', 'Meilleur endroit où vendre', 'Bester Verkaufsort', 'Mejor lugar para vender'],
  ['Sell price / SCU', 'Prix de vente / SCU', 'Verkaufspreis / SCU', 'Precio de venta / SCU'],
  ['Profit / SCU', 'Profit / SCU', 'Gewinn / SCU', 'Beneficio / SCU'],
  ['You can carry', 'Vous pouvez porter', 'Du kannst tragen', 'Puedes llevar'],
  ['Est. profit', 'Profit estimé', 'Gesch. Gewinn', 'Beneficio est.'],
  ['Reported', 'Relevé', 'Gemeldet', 'Reportado'],
  ['collecting…', 'collecte…', 'wird gesammelt…', 'recopilando…'],
  ['Builds up while this page is open: one point every 15 minutes', 'Se remplit tant que la page est ouverte : un point toutes les 15 minutes', 'Füllt sich, solange die Seite offen ist: ein Punkt alle 15 Minuten', 'Se va llenando mientras la página está abierta: un punto cada 15 minutos'],
  ['{0} → {1} SCU over {2} refreshes ({3} – {4})', '{0} → {1} SCU sur {2} actualisations ({3} – {4})', '{0} → {1} SCU über {2} Aktualisierungen ({3} – {4})', '{0} → {1} SCU en {2} actualizaciones ({3} – {4})'],
  ['What this shop buys from you ({n})', 'Ce que cette boutique vous achète ({n})', 'Was dieser Shop dir abkauft ({n})', 'Lo que esta tienda te compra ({n})'],
  ['This shop buys nothing.', 'Cette boutique n’achète rien.', 'Dieser Shop kauft nichts.', 'Esta tienda no compra nada.'],
  ['Pays / SCU', 'Paie / SCU', 'Zahlt / SCU', 'Paga / SCU'],
  ['Their storage (SCU)', 'Leur stockage (SCU)', 'Ihr Lager (SCU)', 'Su almacén (SCU)'],
  ['Storage level', 'Niveau de stockage', 'Lagerfüllung', 'Nivel de almacén'],
  ['24 h storage', 'Stockage 24 h', 'Lager 24 h', 'Almacén 24 h'],
  ['Will buy (SCU)', 'Achètera (SCU)', 'Kauft (SCU)', 'Comprará (SCU)'],
  ['nowhere known', 'nulle part connu', 'nirgends bekannt', 'ningún sitio conocido'],
  ['No known shop buys this commodity.', 'Aucune boutique connue n’achète cette marchandise.', 'Kein bekannter Shop kauft diese Ware.', 'Ninguna tienda conocida compra esta mercancía.'],
  ['Unknown', 'Inconnu', 'Unbekannt', 'Desconocido'],
  ['unknown', 'inconnu', 'unbekannt', 'desconocido'],

  // stock levels
  ['Out of stock', 'Rupture', 'Ausverkauft', 'Agotado'],
  ['Very low', 'Très bas', 'Sehr niedrig', 'Muy bajo'],
  ['Low', 'Bas', 'Niedrig', 'Bajo'],
  ['Medium', 'Moyen', 'Mittel', 'Medio'],
  ['High', 'Haut', 'Hoch', 'Alto'],
  ['Very high', 'Très haut', 'Sehr hoch', 'Muy alto'],
  ['Max', 'Max', 'Max', 'Máx.'],
  ['Empty', 'Vide', 'Leer', 'Vacío'],
  ['Full', 'Plein', 'Voll', 'Lleno'],
  ['empty', 'vide', 'leer', 'vacío'],

  // cargo warnings and traits
  ['Illegal', 'Illégal', 'Illegal', 'Ilegal'],
  ['QT volatile', 'Instable en QT', 'QT-instabil', 'Inestable en QT'],
  ['Perishable', 'Périssable', 'Verderblich', 'Perecedero'],
  ['Explosive', 'Explosif', 'Explosiv', 'Explosivo'],
  ['⇅ Autoload', '⇅ Chargement auto', '⇅ Autoladen', '⇅ Carga auto'],
  ['Autoload: cargo is moved to and from your ship automatically at this terminal', 'Chargement auto : la cargaison est chargée et déchargée de votre vaisseau automatiquement à ce terminal', 'Autoladen: Fracht wird an diesem Terminal automatisch auf und von deinem Schiff bewegt', 'Carga auto: la carga se sube y se baja de tu nave automáticamente en esta terminal'],

  // ages
  ['{n} min ago', 'il y a {n} min', 'vor {n} Min.', 'hace {n} min'],
  ['{n} h ago', 'il y a {n} h', 'vor {n} h', 'hace {n} h'],
  ['{n} d ago', 'il y a {n} j', 'vor {n} T.', 'hace {n} d'],
  ['reported {0}', 'relevé {0}', 'gemeldet {0}', 'reportado {0}'],

  // ---------- Best Routes ----------
  ["Enter how much you want to invest and your cargo space. You'll get the best thing to buy, where to buy it, and where to sell it. If one item can't fill your hold, the plan adds others on the same route.",
    'Indiquez combien vous voulez investir et votre espace de soute. Vous obtiendrez la meilleure chose à acheter, où l’acheter et où la revendre. Si un seul article ne remplit pas la soute, le plan en ajoute d’autres sur la même route.',
    'Gib an, wie viel du investieren willst und deinen Frachtraum. Du bekommst die beste Ware, wo du sie kaufst und wo du sie verkaufst. Füllt eine Ware den Frachtraum nicht, ergänzt der Plan weitere auf derselben Route.',
    'Indica cuánto quieres invertir y tu espacio de carga. Obtendrás lo mejor para comprar, dónde comprarlo y dónde venderlo. Si un artículo no llena la bodega, el plan añade otros en la misma ruta.'],
  ['Investment (aUEC)', 'Investissement (aUEC)', 'Investition (aUEC)', 'Inversión (aUEC)'],
  ['Start system', 'Système de départ', 'Startsystem', 'Sistema de salida'],
  ['End system', 'Système d’arrivée', 'Zielsystem', 'Sistema de llegada'],
  ['Any system', 'N’importe quel système', 'Beliebiges System', 'Cualquier sistema'],
  ['Start from', 'Partir de', 'Start bei', 'Salir de'],
  ['Anywhere', 'N’importe où', 'Überall', 'Cualquier lugar'],
  ['Prices reported within', 'Prix relevés depuis moins de', 'Preise gemeldet innerhalb von', 'Precios reportados en'],
  ['24 hours', '24 heures', '24 Stunden', '24 horas'],
  ['3 days', '3 jours', '3 Tagen', '3 días'],
  ['7 days', '7 jours', '7 Tagen', '7 días'],
  ['Any age', 'Peu importe', 'Beliebig', 'Cualquier antigüedad'],
  ['Stay in one system', 'Rester dans un système', 'In einem System bleiben', 'Quedarse en un sistema'],
  ['Not needed: you picked both a start and an end system', 'Inutile : vous avez choisi un système de départ et d’arrivée', 'Nicht nötig: Du hast Start- und Zielsystem gewählt', 'No hace falta: elegiste sistema de salida y de llegada'],
  ['Mix goods to fill the hold', 'Mélanger pour remplir la soute', 'Waren mischen, um den Frachtraum zu füllen', 'Mezclar mercancías para llenar la bodega'],
  ['Loop (round trip)', 'Boucle (aller-retour)', 'Schleife (Hin und zurück)', 'Bucle (ida y vuelta)'],
  ['After selling, buy what the second location sells and the first location buys back, so you never fly empty',
    'Après la vente, achetez ce que le second lieu vend et que le premier rachète, pour ne jamais voler à vide',
    'Kaufe nach dem Verkauf, was der zweite Ort verkauft und der erste zurückkauft, damit du nie leer fliegst',
    'Tras vender, compra lo que vende el segundo lugar y recompra el primero, para no volar nunca vacío'],
  ['⇅ Autoload only', '⇅ Chargement auto uniquement', '⇅ Nur Autoladen', '⇅ Solo carga auto'],
  ['Only routes where both the buy and the sell terminal load cargo onto your ship automatically',
    'Seulement les routes où les terminaux d’achat et de vente chargent la cargaison automatiquement',
    'Nur Routen, bei denen Kauf- und Verkaufsterminal die Fracht automatisch auf dein Schiff laden',
    'Solo rutas en las que la terminal de compra y la de venta cargan la mercancía en tu nave automáticamente'],
  ['Include illegal goods', 'Inclure les marchandises illégales', 'Illegale Waren einbeziehen', 'Incluir mercancías ilegales'],
  ['Recommended for {0} aUEC and {n} SCU', 'Recommandé pour {0} aUEC et {n} SCU', 'Empfohlen für {0} aUEC und {n} SCU', 'Recomendado para {0} aUEC y {n} SCU'],
  ['Recommended for any budget and {n} SCU', 'Recommandé pour tout budget et {n} SCU', 'Empfohlen für jedes Budget und {n} SCU', 'Recomendado para cualquier presupuesto y {n} SCU'],
  ['Recommended loop for {0} aUEC and {n} SCU', 'Boucle recommandée pour {0} aUEC et {n} SCU', 'Empfohlene Schleife für {0} aUEC und {n} SCU', 'Bucle recomendado para {0} aUEC y {n} SCU'],
  ['Recommended loop for any budget and {n} SCU', 'Boucle recommandée pour tout budget et {n} SCU', 'Empfohlene Schleife für jedes Budget und {n} SCU', 'Bucle recomendado para cualquier presupuesto y {n} SCU'],
  ['Invest', 'Investir', 'Einsatz', 'Inversión'],
  ['Profit', 'Profit', 'Gewinn', 'Beneficio'],
  ['Return', 'Rendement', 'Rendite', 'Rentabilidad'],
  ['ROI', 'ROI', 'ROI', 'ROI'],
  ['Cargo used', 'Soute utilisée', 'Frachtraum genutzt', 'Carga usada'],
  ['Buy', 'Achat', 'Kauf', 'Compra'],
  ['Buy / SCU', 'Achat / SCU', 'Kauf / SCU', 'Compra / SCU'],
  ['Cost', 'Coût', 'Kosten', 'Coste'],
  ['Stock at {0}', 'Stock à {0}', 'Bestand in {0}', 'Stock en {0}'],
  ['Sell / SCU', 'Vente / SCU', 'Verkauf / SCU', 'Venta / SCU'],
  ["They'll buy", 'Ils achèteront', 'Sie kaufen', 'Comprarán'],
  ['Their storage', 'Leur stockage', 'Ihr Lager', 'Su almacén'],
  ['Leg 1', 'Étape 1', 'Etappe 1', 'Tramo 1'],
  ['Leg 2', 'Étape 2', 'Etappe 2', 'Tramo 2'],
  ['Leg 1 profit', 'Profit étape 1', 'Gewinn Etappe 1', 'Beneficio tramo 1'],
  ['Leg 2 profit', 'Profit étape 2', 'Gewinn Etappe 2', 'Beneficio tramo 2'],
  ['Loop profit', 'Profit de la boucle', 'Gewinn der Schleife', 'Beneficio del bucle'],
  ['Carry back', 'Au retour', 'Rückfracht', 'De vuelta'],
  ['nothing', 'rien', 'nichts', 'nada'],
  ['Nothing profitable to carry back from {0} to {1} with these filters. Fly back empty.',
    'Rien de rentable à rapporter de {0} à {1} avec ces filtres. Rentrez à vide.',
    'Mit diesen Filtern lohnt sich keine Rückfracht von {0} nach {1}. Flieg leer zurück.',
    'Nada rentable que llevar de vuelta de {0} a {1} con estos filtros. Vuelve vacío.'],
  ['What to buy', 'Quoi acheter', 'Was kaufen', 'Qué comprar'],
  ['Buy at', 'Acheter à', 'Kaufen in', 'Comprar en'],
  ['Sell at', 'Vendre à', 'Verkaufen in', 'Vender en'],
  ['More options by commodity', 'Plus d’options par marchandise', 'Weitere Optionen nach Ware', 'Más opciones por mercancía'],
  ['· click one to see all its routes', '· cliquez pour voir toutes ses routes', '· klicke, um alle Routen zu sehen', '· haz clic para ver todas sus rutas'],
  ['Commodity', 'Marchandise', 'Ware', 'Mercancía'],
  ['Best buy at', 'Meilleur achat à', 'Bester Kauf in', 'Mejor compra en'],
  ['Best sell at', 'Meilleure vente à', 'Bester Verkauf in', 'Mejor venta en'],
  ['Routes', 'Routes', 'Routen', 'Rutas'],
  ['Oldest report', 'Relevé le plus ancien', 'Älteste Meldung', 'Reporte más antiguo'],
  ['+ {n} other good', '+ {n} autre marchandise', '+ {n} weitere Ware', '+ {n} mercancía más'],
  ['+ {n} other goods', '+ {n} autres marchandises', '+ {n} weitere Waren', '+ {n} mercancías más'],
  ['Showing the best 25 of {n} routes.', 'Affichage des 25 meilleures routes sur {n}.', 'Die besten 25 von {n} Routen.', 'Mostrando las 25 mejores de {n} rutas.'],
  ['No profitable route with this investment and these filters. Try a bigger budget, more cargo space or fewer filters.',
    'Aucune route rentable avec cet investissement et ces filtres. Essayez un plus gros budget, plus d’espace de soute ou moins de filtres.',
    'Keine profitable Route mit diesem Einsatz und diesen Filtern. Versuch ein größeres Budget, mehr Frachtraum oder weniger Filter.',
    'No hay ruta rentable con esta inversión y estos filtros. Prueba con más presupuesto, más espacio de carga o menos filtros.'],

  // ---------- Commodity Guide ----------
  ["Every tradeable commodity: what it is, its risks, and where it's cheapest and most valuable.",
    'Toutes les marchandises échangeables : ce qu’elles sont, leurs risques, et où elles sont le moins chères et le plus rentables.',
    'Jede handelbare Ware: was sie ist, ihre Risiken und wo sie am günstigsten und am wertvollsten ist.',
    'Todas las mercancías comerciables: qué son, sus riesgos y dónde son más baratas y más valiosas.'],
  ['Search', 'Recherche', 'Suche', 'Buscar'],
  ['name, code or kind…', 'nom, code ou type…', 'Name, Code oder Art…', 'nombre, código o tipo…'],
  ['Kind', 'Type', 'Art', 'Tipo'],
  ['All kinds', 'Tous les types', 'Alle Arten', 'Todos los tipos'],
  ['Traits', 'Particularités', 'Merkmale', 'Rasgos'],
  ['Cheapest buy', 'Achat le moins cher', 'Günstigster Kauf', 'Compra más barata'],
  ['Where', 'Où', 'Wo', 'Dónde'],
  ['Best sell', 'Meilleure vente', 'Bester Verkauf', 'Mejor venta'],
  ['Max margin', 'Marge max', 'Max. Marge', 'Margen máx.'],
  ['Shops', 'Boutiques', 'Shops', 'Tiendas'],
  ['Click to sort', 'Cliquez pour trier', 'Zum Sortieren klicken', 'Haz clic para ordenar'],
  ['Refined', 'Raffiné', 'Raffiniert', 'Refinado'],
  ['Harvestable', 'Récoltable', 'Erntbar', 'Recolectable'],
  ['Raw ore', 'Minerai brut', 'Roherz', 'Mineral en bruto'],
  ['Refinable', 'Raffinable', 'Raffinierbar', 'Refinable'],
  ['Event', 'Événement', 'Event', 'Evento'],
  ['{n} buy', '{n} achat', '{n} Kauf', '{n} compra'],
  ['{n} sell', '{n} vente', '{n} Verkauf', '{n} venta'],
  ['Where to buy ({n})', 'Où acheter ({n})', 'Wo kaufen ({n})', 'Dónde comprar ({n})'],
  ['Where to sell ({n})', 'Où vendre ({n})', 'Wo verkaufen ({n})', 'Dónde vender ({n})'],
  ['· click to pick · prices per SCU', '· cliquez pour choisir · prix par SCU', '· zum Auswählen klicken · Preise pro SCU', '· haz clic para elegir · precios por SCU'],
  ['Profit calculator', 'Calculateur de profit', 'Gewinnrechner', 'Calculadora de beneficio'],
  ['Quantity (SCU)', 'Quantité (SCU)', 'Menge (SCU)', 'Cantidad (SCU)'],
  ['Per SCU', 'Par SCU', 'Pro SCU', 'Por SCU'],
  ['Revenue', 'Recette', 'Erlös', 'Ingresos'],
  ['Stock', 'Stock', 'Bestand', 'Stock'],
  ['Level', 'Niveau', 'Stand', 'Nivel'],
  ['Will buy', 'Achètera', 'Kauft', 'Comprará'],
  ['{0} only has {n} SCU in stock.', '{0} n’a que {n} SCU en stock.', '{0} hat nur {n} SCU auf Lager.', '{0} solo tiene {n} SCU en stock.'],
  ['{0} only buys {n} SCU.', '{0} n’achète que {n} SCU.', '{0} kauft nur {n} SCU.', '{0} solo compra {n} SCU.'],
  ['Needs a jump: {0} → {1}.', 'Saut nécessaire : {0} → {1}.', 'Sprung nötig: {0} → {1}.', 'Requiere un salto: {0} → {1}.'],
  ['Use boxes of {n} SCU or smaller.', 'Utilisez des caisses de {n} SCU ou moins.', 'Nutze Kisten mit {n} SCU oder kleiner.', 'Usa cajas de {n} SCU o menos.'],
  ['Oldest price reported {0}.', 'Prix le plus ancien relevé {0}.', 'Ältester Preis gemeldet {0}.', 'Precio más antiguo reportado {0}.'],
  ['No shop sells this commodity. It has to be mined, harvested or looted.', 'Aucune boutique ne vend cette marchandise. Il faut la miner, la récolter ou la piller.', 'Kein Shop verkauft diese Ware. Sie muss abgebaut, geerntet oder erbeutet werden.', 'Ninguna tienda vende esta mercancía. Hay que minarla, recolectarla o saquearla.'],
  ['No shop buys this commodity.', 'Aucune boutique n’achète cette marchandise.', 'Kein Shop kauft diese Ware.', 'Ninguna tienda compra esta mercancía.'],

  // ---------- Salvage: sub-navigation ----------
  ['Sell Salvage', 'Vendre la récup', 'Bergungsgut verkaufen', 'Vender chatarra'],
  ['Salvage Ships', 'Vaisseaux de récupération', 'Bergungsschiffe', 'Naves de chatarrería'],
  ['Cargo Crates', 'Caisses de cargaison', 'Frachtkisten', 'Cajas de carga'],
  ['Salvage Guide', 'Guide de la récupération', 'Bergungsleitfaden', 'Guía de chatarrería'],

  // ---------- Sell Salvage ----------
  ["Enter how much of each salvage material you're carrying. You'll see the best place to sell all of it in one stop, and the best price for each material on its own.",
    'Indiquez la quantité de chaque matériau de récupération que vous transportez. Vous verrez le meilleur endroit pour tout vendre en un arrêt, et le meilleur prix de chaque matériau séparément.',
    'Gib an, wie viel von jedem Bergungsmaterial du dabeihast. Du siehst den besten Ort, um alles an einem Halt zu verkaufen, und den besten Preis für jedes Material einzeln.',
    'Indica cuánto llevas de cada material de chatarrería. Verás el mejor lugar para venderlo todo en una parada y el mejor precio de cada material por separado.'],
  ['Star system', 'Système stellaire', 'Sternsystem', 'Sistema estelar'],
  ['All systems', 'Tous les systèmes', 'Alle Systeme', 'Todos los sistemas'],
  ['Fill from your ship:', 'Remplir selon votre vaisseau :', 'Aus deinem Schiff übernehmen:', 'Rellenar según tu nave:'],
  ['Enter how many SCU of each material you carry.', 'Indiquez combien de SCU de chaque matériau vous transportez.', 'Gib an, wie viele SCU jedes Materials du dabeihast.', 'Indica cuántos SCU llevas de cada material.'],
  ['Your load', 'Votre chargement', 'Deine Ladung', 'Tu carga'],
  ['Best places to sell everything', 'Meilleurs endroits pour tout vendre', 'Beste Orte, um alles zu verkaufen', 'Mejores lugares para venderlo todo'],
  ['· ranked by the total value of your load', '· classés par valeur totale de votre chargement', '· nach Gesamtwert deiner Ladung sortiert', '· ordenados por el valor total de tu carga'],
  ['Your load is worth', 'Votre chargement vaut', 'Deine Ladung ist wert', 'Tu carga vale'],
  ['Notes', 'Notes', 'Hinweise', 'Notas'],
  ['Max box', 'Caisse max', 'Max. Kiste', 'Caja máx.'],
  ['Best price per material', 'Meilleur prix par matériau', 'Bester Preis pro Material', 'Mejor precio por material'],
  ['From hull scraping. Sell as is.', 'Issu du raclage de coque. Se vend tel quel.', 'Aus dem Abschaben der Hülle. Wird so verkauft.', 'Del raspado del casco. Se vende tal cual.'],
  ['From structural salvage, after refining.', 'Issu de la récupération structurelle, après raffinage.', 'Aus struktureller Bergung, nach dem Raffinieren.', 'Del desguace estructural, tras refinarlo.'],
  ['Sold and bought at shops like a trade good.', 'Acheté et vendu en boutique comme une marchandise.', 'Wird in Shops wie eine Handelsware gekauft und verkauft.', 'Se compra y vende en tiendas como una mercancía.'],
  ['Location', 'Lieu', 'Ort', 'Lugar'],
  ['Price', 'Prix', 'Preis', 'Precio'],
  ['Storage', 'Stockage', 'Lager', 'Almacén'],
  ['No buyer with these filters.', 'Aucun acheteur avec ces filtres.', 'Kein Käufer mit diesen Filtern.', 'Ningún comprador con estos filtros.'],
  ['No shop buys this with these filters. Try a wider system or older prices.', 'Aucune boutique n’achète ceci avec ces filtres. Élargissez le système ou acceptez des prix plus anciens.', 'Kein Shop kauft das mit diesen Filtern. Versuch ein anderes System oder ältere Preise.', 'Ninguna tienda compra esto con estos filtros. Prueba otro sistema o precios más antiguos.'],
  ['✓ Sell everything in one stop', '✓ Tout vendre en un seul arrêt', '✓ Alles an einem Halt verkaufen', '✓ Véndelo todo en una parada'],
  ['{0} per SCU', '{0} par SCU', '{0} pro SCU', '{0} por SCU'],
  ['Only {0} aUEC ({1}%) less than going to {n} separate places.', 'Seulement {0} aUEC ({1} %) de moins qu’en allant à {n} endroits différents.', 'Nur {0} aUEC ({1} %) weniger, als zu {n} verschiedenen Orten zu fliegen.', 'Solo {0} aUEC ({1} %) menos que yendo a {n} lugares distintos.'],
  ['Same as the best price for every item: no reason to go anywhere else.', 'Identique au meilleur prix de chaque article : aucune raison d’aller ailleurs.', 'Gleich dem besten Preis für jede Ware: kein Grund, woanders hinzufliegen.', 'Igual al mejor precio de cada artículo: no hace falta ir a otro sitio.'],
  ['Selling each at its best place ({n} stops)', 'Chaque article à son meilleur endroit ({n} arrêts)', 'Jede Ware an ihrem besten Ort ({n} Halte)', 'Cada uno en su mejor lugar ({n} paradas)'],
  ['Selling each at its best place ({n} stop)', 'Chaque article à son meilleur endroit ({n} arrêt)', 'Jede Ware an ihrem besten Ort ({n} Halt)', 'Cada uno en su mejor lugar ({n} parada)'],
  ['No single place buys all of these. Best two stops:', 'Aucun endroit n’achète tout. Les deux meilleurs arrêts :', 'Kein einzelner Ort kauft alles. Die besten zwei Halte:', 'Ningún lugar lo compra todo. Las dos mejores paradas:'],
  ['Sell {0} at {1}; {2} at {3}', 'Vendez {0} à {1} ; {2} à {3}', 'Verkaufe {0} in {1}; {2} in {3}', 'Vende {0} en {1}; {2} en {3}'],
  ['Every place that buys your crates', 'Tous les endroits qui achètent vos caisses', 'Alle Orte, die deine Kisten kaufen', 'Todos los lugares que compran tus cajas'],
  ['· places that buy everything come first', '· ceux qui achètent tout en premier', '· Orte, die alles kaufen, zuerst', '· primero los que lo compran todo'],
  ['Buys', 'Achète', 'Kauft', 'Compra'],
  ['✓ all', '✓ tout', '✓ alles', '✓ todo'],
  ["doesn't buy", 'n’achète pas', 'kauft nicht', 'no compra'],
  ['{n} of {n2}', '{n} sur {n2}', '{n} von {n2}', '{n} de {n2}'],
  ['{0}: only {n} SCU', '{0} : seulement {n} SCU', '{0}: nur {n} SCU', '{0}: solo {n} SCU'],
  ['no {0}', 'sans {0}', 'ohne {0}', 'sin {0}'],
  ['no limit', 'sans limite', 'ohne Limit', 'sin límite'],
  ['Best price for each crate', 'Meilleur prix pour chaque caisse', 'Bester Preis für jede Kiste', 'Mejor precio para cada caja'],
  ['up to {0} / SCU', 'jusqu’à {0} / SCU', 'bis zu {0} / SCU', 'hasta {0} / SCU'],
  ['at {0}', 'à {0}', 'in {0}', 'en {0}'],
  ['{0} at {1}', '{0} à {1}', '{0} in {1}', '{0} en {1}'],

  // ---------- Salvage Ships ----------
  ['loading ships…', 'chargement des vaisseaux…', 'Schiffe werden geladen…', 'cargando naves…'],
  ['Loading salvage ships…', 'Chargement des vaisseaux de récupération…', 'Bergungsschiffe werden geladen…', 'Cargando naves de chatarrería…'],
  ["Couldn't load the ship list from UEX. Try ↻ Refresh.", 'Impossible de charger la liste des vaisseaux depuis UEX. Essayez ↻ Actualiser.', 'Die Schiffsliste von UEX konnte nicht geladen werden. Versuch ↻ Aktualisieren.', 'No se pudo cargar la lista de naves de UEX. Prueba ↻ Actualizar.'],
  ['Every ship built for salvage. Capacity and crew come from UEX. The "full hold" value uses the best RMC price right now. Click a ship\'s guide for step-by-step instructions.',
    'Tous les vaisseaux conçus pour la récupération. Capacité et équipage viennent d’UEX. La valeur « soute pleine » utilise le meilleur prix actuel du RMC. Ouvrez le guide d’un vaisseau pour les instructions pas à pas.',
    'Alle Schiffe für Bergung. Kapazität und Crew stammen von UEX. Der Wert „voller Frachtraum“ nutzt den aktuell besten RMC-Preis. Öffne die Anleitung eines Schiffs für Schritt-für-Schritt-Hinweise.',
    'Todas las naves hechas para chatarrería. La capacidad y la tripulación vienen de UEX. El valor «bodega llena» usa el mejor precio actual del RMC. Abre la guía de una nave para ver las instrucciones paso a paso.'],
  ['Light', 'Léger', 'Leicht', 'Ligera'],
  ['Medium', 'Moyen', 'Mittel', 'Medio'],
  ['Heavy', 'Lourd', 'Schwer', 'Pesada'],
  ['Cargo', 'Soute', 'Fracht', 'Carga'],
  ['Crew', 'Équipage', 'Crew', 'Tripulación'],
  ['Solo', 'Solo', 'Solo', 'Solo'],
  ['Pad', 'Plateforme', 'Landeplatz', 'Plataforma'],
  ['Fractures', 'Fracture', 'Zerlegt', 'Fractura'],
  ['check in-game', 'à vérifier en jeu', 'im Spiel prüfen', 'compruébalo en el juego'],
  ['Any size', 'Toute taille', 'Jede Größe', 'Cualquier tamaño'],
  ['Up to Freelancer size', 'Jusqu’à la taille d’un Freelancer', 'Bis Freelancer-Größe', 'Hasta el tamaño de una Freelancer'],
  ['Up to Mercury Star Runner size', 'Jusqu’à la taille d’un Mercury Star Runner', 'Bis Mercury-Star-Runner-Größe', 'Hasta el tamaño de una Mercury Star Runner'],
  ['Up to Origin 600i / Starfarer size', 'Jusqu’à la taille d’un Origin 600i / Starfarer', 'Bis Origin-600i-/Starfarer-Größe', 'Hasta el tamaño de una Origin 600i / Starfarer'],
  ['3–5 recommended', '3 à 5 recommandés', '3–5 empfohlen', '3–5 recomendados'],
  ['A full hold of RMC is worth about', 'Une soute pleine de RMC vaut environ', 'Ein voller Frachtraum RMC ist etwa wert', 'Una bodega llena de RMC vale unos'],
  ['Official ship page ↗', 'Page officielle du vaisseau ↗', 'Offizielle Schiffsseite ↗', 'Página oficial de la nave ↗'],
  ['How to salvage with the {0}', 'Récupérer avec le {0}', 'Bergen mit der {0}', 'Cómo hacer chatarrería con la {0}'],
  // Salvation
  ['Two extendable salvage arms.', 'Deux bras de récupération déployables.', 'Zwei ausfahrbare Bergungsarme.', 'Dos brazos de chatarrería extensibles.'],
  ['An internal processor turns material straight into SCU crates and moves them to the 6 SCU cargo grid, so you never leave the pilot seat.',
    'Un processeur interne transforme directement la matière en caisses SCU et les place sur la grille de 6 SCU : vous ne quittez jamais le siège pilote.',
    'Ein interner Prozessor macht aus dem Material direkt SCU-Kisten und stellt sie aufs 6-SCU-Frachtgitter, du verlässt nie den Pilotensitz.',
    'Un procesador interno convierte el material directamente en cajas SCU y las coloca en la rejilla de 6 SCU, así que nunca dejas el asiento del piloto.'],
  ['Produces RMC and Rubble (raw construction material to refine).', 'Produit du RMC et du Rubble (matériau de construction brut à raffiner).', 'Erzeugt RMC und Rubble (rohes Baumaterial zum Raffinieren).', 'Produce RMC y Rubble (material de construcción en bruto para refinar).'],
  ['Quantum to the wreck and scan it: check the owner ("Gamerules" = abandoned) and that its shields are down.',
    'Faites un saut quantique jusqu’à l’épave et scannez-la : vérifiez le propriétaire (« Gamerules » = abandonnée) et que ses boucliers sont tombés.',
    'Spring per Quantum zum Wrack und scanne es: Prüfe den Besitzer („Gamerules“ = verlassen) und ob die Schilde unten sind.',
    'Viaja en cuántico hasta el resto y escanéalo: comprueba el dueño («Gamerules» = abandonado) y que sus escudos estén caídos.'],
  ['Switch to salvage mode (default', 'Passez en mode récupération (par défaut', 'Wechsle in den Bergungsmodus (Standard', 'Cambia al modo chatarrería (por defecto'],
  [') and extend the arms.', ') et déployez les bras.', ') und fahre die Arme aus.', ') y extiende los brazos.'],
  [') and scrape the hull.', ') et raclez la coque.', ') und schabe die Hülle ab.', ') y raspa el casco.'],
  ['Sweep the hull with both beams. The processor crates the RMC into your grid on its own.', 'Balayez la coque avec les deux faisceaux. Le processeur met le RMC en caisses sur votre grille tout seul.', 'Überstreiche die Hülle mit beiden Strahlen. Der Prozessor verpackt das RMC selbst auf dein Gitter.', 'Barre el casco con ambos haces. El procesador mete el RMC en cajas en tu rejilla él solo.'],
  ['For small wrecks (up to Freelancer size), fracture the stripped hull, then disintegrate the chunks for Rubble.', 'Pour les petites épaves (jusqu’à un Freelancer), fracturez la coque mise à nu, puis désintégrez les morceaux pour obtenir du Rubble.', 'Bei kleinen Wracks (bis Freelancer-Größe) zerbrich die freigelegte Hülle und desintegriere die Brocken zu Rubble.', 'En restos pequeños (hasta una Freelancer), fractura el casco pelado y desintegra los trozos para obtener Rubble.'],
  ["At 6 SCU you're full: fly to the nearest sell point, sell the RMC, and refine the Rubble.", 'À 6 SCU vous êtes plein : volez jusqu’au point de vente le plus proche, vendez le RMC et raffinez le Rubble.', 'Bei 6 SCU bist du voll: Flieg zum nächsten Verkaufspunkt, verkaufe das RMC und raffiniere das Rubble.', 'Con 6 SCU estás lleno: vuela al punto de venta más cercano, vende el RMC y refina el Rubble.'],
  ['💡 It fills up fast, so pick wrecks close to a sell point.', '💡 Il se remplit vite : choisissez des épaves proches d’un point de vente.', '💡 Es ist schnell voll, also wähle Wracks nahe einem Verkaufspunkt.', '💡 Se llena rápido: elige restos cerca de un punto de venta.'],
  ['💡 The cheapest way to learn beams and fracturing.', '💡 La façon la moins chère d’apprendre les faisceaux et la fracturation.', '💡 Der günstigste Weg, Strahlen und Zerlegen zu lernen.', '💡 La forma más barata de aprender los haces y la fracturación.'],
  // Vulture
  ['The pilot seat runs both flight and salvage.', 'Le siège pilote gère à la fois le vol et la récupération.', 'Der Pilotensitz steuert Flug und Bergung.', 'El asiento del piloto controla el vuelo y la chatarrería.'],
  ['13 SCU material buffer that empties into a 12 SCU cargo grid.', 'Tampon de matière de 13 SCU qui se vide dans une grille de 12 SCU.', '13-SCU-Materialpuffer, der sich in ein 12-SCU-Frachtgitter leert.', 'Búfer de material de 13 SCU que se vacía en una rejilla de 12 SCU.'],
  ['Two scraper heads you can swap (Abrade, Cinch, Hart…). Has a tractor beam.', 'Deux têtes de raclage interchangeables (Abrade, Cinch, Hart…). Possède un rayon tracteur.', 'Zwei austauschbare Schabeköpfe (Abrade, Cinch, Hart…). Hat einen Traktorstrahl.', 'Dos cabezales de raspado intercambiables (Abrade, Cinch, Hart…). Tiene rayo tractor.'],
  ['Approach the wreck and scan it for owner, shields and power.', 'Approchez l’épave et scannez son propriétaire, ses boucliers et son alimentation.', 'Nähere dich dem Wrack und scanne Besitzer, Schilde und Energie.', 'Acércate al resto y escanea su dueño, escudos y energía.'],
  ['Press', 'Appuyez sur', 'Drücke', 'Pulsa'],
  ['(default) for salvage mode. The arms unfold.', '(par défaut) pour le mode récupération. Les bras se déplient.', '(Standard) für den Bergungsmodus. Die Arme klappen aus.', '(por defecto) para el modo chatarrería. Los brazos se despliegan.'],
  ['Scrape with both heads, keeping them on bare plating. Widen or narrow the beam spacing to match the panels.', 'Raclez avec les deux têtes en restant sur le blindage. Écartez ou rapprochez les faisceaux selon les panneaux.', 'Schabe mit beiden Köpfen und bleib auf der Panzerung. Passe den Strahlabstand an die Platten an.', 'Raspa con ambos cabezales sobre el blindaje. Abre o cierra la separación de los haces según los paneles.'],
  ['The 13 SCU buffer packs into boxes on the 12 SCU grid. Keep the grid clear. If a box jams, step out and move it with a multi-tool or MaxLift tractor beam.', 'Le tampon de 13 SCU est mis en caisses sur la grille de 12 SCU. Gardez la grille dégagée. Si une caisse se bloque, sortez et déplacez-la avec un multi-outil ou un rayon tracteur MaxLift.', 'Der 13-SCU-Puffer wird in Kisten aufs 12-SCU-Gitter gepackt. Halte das Gitter frei. Klemmt eine Kiste, steig aus und bewege sie mit einem Multi-Tool oder MaxLift-Traktorstrahl.', 'El búfer de 13 SCU se empaqueta en cajas en la rejilla de 12 SCU. Mantén la rejilla libre. Si una caja se atasca, sal y muévela con una multiherramienta o un rayo tractor MaxLift.'],
  ['Small wrecks: fracture, then disintegrate the chunks for Rubble.', 'Petites épaves : fracturez, puis désintégrez les morceaux pour du Rubble.', 'Kleine Wracks: zerbrechen, dann die Brocken zu Rubble desintegrieren.', 'Restos pequeños: fractura y luego desintegra los trozos para obtener Rubble.'],
  ['Return to sell RMC and refine the Rubble when the grid is full.', 'Rentrez vendre le RMC et raffiner le Rubble quand la grille est pleine.', 'Kehre zurück, um RMC zu verkaufen und Rubble zu raffinieren, wenn das Gitter voll ist.', 'Vuelve a vender el RMC y a refinar el Rubble cuando la rejilla esté llena.'],
  ['💡 The grid fills after a few small fractures, so scrape first and fracture last.', '💡 La grille se remplit après quelques petites fractures : raclez d’abord, fracturez en dernier.', '💡 Das Gitter ist nach ein paar kleinen Zerlegungen voll, also erst schaben, zuletzt zerlegen.', '💡 La rejilla se llena tras unas pocas fracturas, así que raspa primero y fractura al final.'],
  ['💡 Cinch or Hart heads keep 100% of the material.', '💡 Les têtes Cinch ou Hart conservent 100 % de la matière.', '💡 Cinch- oder Hart-Köpfe behalten 100 % des Materials.', '💡 Los cabezales Cinch o Hart conservan el 100 % del material.'],
  // Fortune
  ['An automated external container dispenser holds up to twelve 1 SCU boxes.', 'Un distributeur externe automatique contient jusqu’à douze caisses de 1 SCU.', 'Ein automatischer externer Kistenspender fasst bis zu zwölf 1-SCU-Kisten.', 'Un dispensador externo automático guarda hasta doce cajas de 1 SCU.'],
  ['A rear elevator gives access to one extra 4 SCU cargo grid.', 'Un ascenseur arrière donne accès à une grille supplémentaire de 4 SCU.', 'Ein Heckaufzug erreicht ein zusätzliches 4-SCU-Frachtgitter.', 'Un ascensor trasero da acceso a una rejilla extra de 4 SCU.'],
  ['Built for one player doing quick scraping runs.', 'Conçu pour un joueur seul qui fait des sessions de raclage rapides.', 'Für einen Spieler gebaut, der schnelle Schabe-Runs macht.', 'Hecha para un jugador que hace raspados rápidos.'],
  ['Fly to the wreck and scan it for owner and shields.', 'Volez jusqu’à l’épave et scannez son propriétaire et ses boucliers.', 'Flieg zum Wrack und scanne Besitzer und Schilde.', 'Vuela al resto y escanea su dueño y escudos.'],
  ['Material is packed into 1 SCU boxes on the external dispenser automatically.', 'La matière est automatiquement mise en caisses de 1 SCU sur le distributeur externe.', 'Material wird automatisch in 1-SCU-Kisten im externen Spender verpackt.', 'El material se empaqueta automáticamente en cajas de 1 SCU en el dispensador externo.'],
  ["Use the rear elevator's 4 SCU grid for components or extra boxes.", 'Utilisez la grille de 4 SCU de l’ascenseur arrière pour les composants ou des caisses en plus.', 'Nutze das 4-SCU-Gitter am Heckaufzug für Komponenten oder zusätzliche Kisten.', 'Usa la rejilla de 4 SCU del ascensor trasero para componentes o cajas extra.'],
  ['When the twelve boxes are full, go sell. 1 SCU boxes fit every terminal.', 'Quand les douze caisses sont pleines, allez vendre. Les caisses de 1 SCU passent dans tous les terminaux.', 'Wenn die zwölf Kisten voll sind, geh verkaufen. 1-SCU-Kisten passen an jedes Terminal.', 'Cuando las doce cajas estén llenas, ve a vender. Las cajas de 1 SCU caben en cualquier terminal.'],
  ['💡 1 SCU boxes are accepted everywhere, even small outposts.', '💡 Les caisses de 1 SCU sont acceptées partout, même dans les petits avant-postes.', '💡 1-SCU-Kisten werden überall angenommen, auch an kleinen Außenposten.', '💡 Las cajas de 1 SCU se aceptan en todas partes, incluso en puestos pequeños.'],
  ['💡 Check in-game how big a wreck the Fortune can fracture in the current patch.', '💡 Vérifiez en jeu quelle taille d’épave le Fortune peut fracturer dans le patch actuel.', '💡 Prüfe im Spiel, wie große Wracks die Fortune im aktuellen Patch zerlegen kann.', '💡 Comprueba en el juego qué tamaño de resto puede fracturar la Fortune en el parche actual.'],
  // MOTH
  ['Three retractable turrets, each with a size 2 salvage laser, operated by crew.', 'Trois tourelles rétractables, chacune avec un laser de récupération taille 2, servies par l’équipage.', 'Drei einfahrbare Türme mit je einem Größe-2-Bergungslaser, von der Crew bedient.', 'Tres torretas retráctiles, cada una con un láser de chatarrería de tamaño 2, manejadas por la tripulación.'],
  ['External filler stations: 64 SCU buffer and a 192 SCU external grid (twelve 8 SCU boxes per side).', 'Stations de remplissage externes : tampon de 64 SCU et grille externe de 192 SCU (douze caisses de 8 SCU par côté).', 'Externe Füllstationen: 64-SCU-Puffer und ein 192-SCU-Außengitter (zwölf 8-SCU-Kisten pro Seite).', 'Estaciones de llenado externas: búfer de 64 SCU y rejilla externa de 192 SCU (doce cajas de 8 SCU por lado).'],
  ['Pilot-operated structural salvage arms.', 'Bras de récupération structurelle pilotés.', 'Vom Piloten bediente Arme für strukturelle Bergung.', 'Brazos de desguace estructural manejados por el piloto.'],
  ['Structural salvage produces Pieces (medium refining time and yield).', 'La récupération structurelle produit des Pieces (temps et rendement de raffinage moyens).', 'Strukturelle Bergung erzeugt Pieces (mittlere Raffinierzeit und Ausbeute).', 'El desguace estructural produce Pieces (tiempo y rendimiento de refinado medios).'],
  ['Crew up: a pilot plus up to three turret operators.', 'Formez l’équipage : un pilote et jusqu’à trois artilleurs.', 'Stell die Crew zusammen: ein Pilot und bis zu drei Turmbediener.', 'Reúne a la tripulación: un piloto y hasta tres operadores de torreta.'],
  ['The pilot parks alongside the wreck. The turret operators scrape the hull for RMC.', 'Le pilote se place le long de l’épave. Les artilleurs raclent la coque pour le RMC.', 'Der Pilot parkt neben dem Wrack. Die Turmbediener schaben die Hülle für RMC ab.', 'El piloto se coloca junto al resto. Los operadores de torreta raspan el casco para obtener RMC.'],
  ['Once the plating is bare, the pilot fractures the hull and disintegrates the chunks with the arms.', 'Une fois le blindage à nu, le pilote fracture la coque et désintègre les morceaux avec les bras.', 'Ist die Panzerung blank, zerbricht der Pilot die Hülle und desintegriert die Brocken mit den Armen.', 'Cuando el blindaje está pelado, el piloto fractura el casco y desintegra los trozos con los brazos.'],
  ['The filler stations pack material into 8 SCU boxes on the external racks.', 'Les stations de remplissage mettent la matière en caisses de 8 SCU sur les racks externes.', 'Die Füllstationen packen Material in 8-SCU-Kisten an den Außengestellen.', 'Las estaciones de llenado empaquetan el material en cajas de 8 SCU en los soportes externos.'],
  ['Fly to a sell point that accepts 8 SCU boxes. Sell the RMC and refine the Pieces.', 'Volez vers un point de vente qui accepte les caisses de 8 SCU. Vendez le RMC et raffinez les Pieces.', 'Flieg zu einem Verkaufspunkt, der 8-SCU-Kisten annimmt. Verkaufe das RMC und raffiniere die Pieces.', 'Vuela a un punto de venta que acepte cajas de 8 SCU. Vende el RMC y refina las Pieces.'],
  ["💡 Check the sell terminal's max box size: 8 SCU boxes don't fit everywhere.", '💡 Vérifiez la taille de caisse max du terminal de vente : les caisses de 8 SCU ne passent pas partout.', '💡 Prüfe die max. Kistengröße des Verkaufsterminals: 8-SCU-Kisten passen nicht überall.', '💡 Comprueba el tamaño máximo de caja de la terminal: las cajas de 8 SCU no caben en todas partes.'],
  ['💡 It can work solo, but turrets make scraping much faster.', '💡 Il peut être utilisé seul, mais les tourelles accélèrent beaucoup le raclage.', '💡 Es geht auch solo, aber mit den Türmen schabst du viel schneller.', '💡 Puede usarse en solitario, pero las torretas aceleran mucho el raspado.'],
  // Reclaimer
  ['420 SCU of combined cargo capacity.', '420 SCU de capacité de soute au total.', '420 SCU Frachtkapazität insgesamt.', '420 SCU de capacidad de carga en total.'],
  ['A large claw that can fracture any vehicle.', 'Une grande pince capable de fracturer n’importe quel véhicule.', 'Eine große Klaue, die jedes Fahrzeug zerlegen kann.', 'Una gran garra que puede fracturar cualquier vehículo.'],
  ['Two filler stations pack RMC and Construction Materials into 1, 2, 4, 8 and 16 SCU boxes.', 'Deux stations de remplissage mettent le RMC et les Construction Materials en caisses de 1, 2, 4, 8 et 16 SCU.', 'Zwei Füllstationen packen RMC und Construction Materials in 1-, 2-, 4-, 8- und 16-SCU-Kisten.', 'Dos estaciones de llenado empaquetan RMC y Construction Materials en cajas de 1, 2, 4, 8 y 16 SCU.'],
  ['Controls, claw and scraper are on separate seats. Two cargo elevators reach the hold.', 'Commandes, pince et racleur sont sur des postes séparés. Deux monte-charges desservent la soute.', 'Steuerung, Klaue und Schaber sind auf getrennten Sitzen. Zwei Frachtaufzüge erreichen den Frachtraum.', 'Los mandos, la garra y el raspador están en asientos separados. Dos ascensores de carga llegan a la bodega.'],
  ['Structural salvage produces Salvage (slowest refining, highest yield). Needs an XL landing pad.', 'La récupération structurelle produit du Salvage (raffinage le plus lent, meilleur rendement). Nécessite une plateforme XL.', 'Strukturelle Bergung erzeugt Salvage (langsamstes Raffinieren, höchste Ausbeute). Braucht einen XL-Landeplatz.', 'El desguace estructural produce Salvage (refinado más lento, mayor rendimiento). Necesita una plataforma XL.'],
  ['Assign roles: pilot, scraper operator, claw/tractor operator and a cargo manager.', 'Répartissez les rôles : pilote, opérateur du racleur, opérateur pince/tracteur et responsable de la soute.', 'Verteile die Rollen: Pilot, Schaber-Bediener, Klauen-/Traktor-Bediener und ein Frachtverwalter.', 'Reparte los roles: piloto, operador del raspador, operador de garra/tractor y un encargado de la carga.'],
  ['The pilot brings the Reclaimer alongside the wreck and holds position.', 'Le pilote amène le Reclaimer le long de l’épave et garde la position.', 'Der Pilot bringt den Reclaimer neben das Wrack und hält die Position.', 'El piloto coloca la Reclaimer junto al resto y mantiene la posición.'],
  ['The tractor operator pulls off components and cargo. The scraper operator strips the hull for RMC.', 'L’opérateur tracteur retire les composants et la cargaison. L’opérateur du racleur décape la coque pour le RMC.', 'Der Traktor-Bediener zieht Komponenten und Fracht ab. Der Schaber-Bediener schält die Hülle für RMC.', 'El operador del tractor arranca componentes y carga. El operador del raspador pela el casco para obtener RMC.'],
  ['The claw operator fractures the bare hull and disintegrates the chunks.', 'L’opérateur de la pince fracture la coque à nu et désintègre les morceaux.', 'Der Klauen-Bediener zerbricht die blanke Hülle und desintegriert die Brocken.', 'El operador de la garra fractura el casco pelado y desintegra los trozos.'],
  ['The cargo manager runs the filler stations and stacks boxes in the hold.', 'Le responsable de la soute gère les stations de remplissage et empile les caisses.', 'Der Frachtverwalter bedient die Füllstationen und stapelt Kisten im Frachtraum.', 'El encargado de la carga maneja las estaciones de llenado y apila las cajas en la bodega.'],
  ['Land at an XL pad or station hangar, sell the RMC and components, and refine the Salvage material.', 'Posez-vous sur une plateforme XL ou dans un hangar de station, vendez le RMC et les composants, et raffinez le Salvage.', 'Lande auf einem XL-Landeplatz oder in einem Stationshangar, verkaufe RMC und Komponenten und raffiniere das Salvage-Material.', 'Aterriza en una plataforma XL o un hangar de estación, vende el RMC y los componentes y refina el material Salvage.'],
  ['💡 Boxes bigger than 24 SCU are hard to move through the elevators. Stick to 16 SCU.', '💡 Les caisses de plus de 24 SCU passent mal dans les ascenseurs. Restez à 16 SCU.', '💡 Kisten über 24 SCU passen schlecht durch die Aufzüge. Bleib bei 16 SCU.', '💡 Las cajas de más de 24 SCU cuestan de mover por los ascensores. Quédate en 16 SCU.'],
  ['💡 One Reclaimer run can be worth millions: protect it with an escort in risky space.', '💡 Une sortie en Reclaimer peut valoir des millions : faites-le escorter dans les zones risquées.', '💡 Ein Reclaimer-Run kann Millionen wert sein: Schütze ihn in gefährlichem Raum mit einer Eskorte.', '💡 Una salida con la Reclaimer puede valer millones: protégela con escolta en zonas peligrosas.'],
  // on foot
  ['Salvage on foot', 'Récupération à pied', 'Bergung zu Fuß', 'Chatarrería a pie'],
  ['No ship needed · fits in your hands', 'Pas besoin de vaisseau · tient dans les mains', 'Kein Schiff nötig · passt in deine Hände', 'Sin nave · cabe en tus manos'],
  ['Clip the', 'Fixez l’accessoire', 'Stecke den', 'Acopla el'],
  ['attachment onto a multi-tool to scrape hull plating into a small canister. Add the', 'sur un multi-outil pour racler le blindage dans un petit réservoir. Ajoutez l’accessoire tracteur', 'Aufsatz auf ein Multi-Tool, um Hüllenpanzerung in einen kleinen Kanister zu schaben. Füge den', 'a una multiherramienta para raspar el blindaje en un pequeño bote. Añade el accesorio'],
  ['tractor attachment to move components and boxes.', 'pour déplacer composants et caisses.', 'Traktor-Aufsatz hinzu, um Komponenten und Kisten zu bewegen.', 'tractor para mover componentes y cajas.'],
  ['Good for learning and for small repairs on your own ship.', 'Idéal pour apprendre et pour de petites réparations sur votre vaisseau.', 'Gut zum Lernen und für kleine Reparaturen am eigenen Schiff.', 'Bueno para aprender y para pequeñas reparaciones en tu nave.'],
  ["The wiki notes that a filled canister sells for no more than an empty one, so it's not a money maker.", 'Le wiki indique qu’un réservoir plein ne se vend pas plus cher qu’un vide : ce n’est pas rentable.', 'Laut Wiki bringt ein voller Kanister nicht mehr als ein leerer, damit verdienst du also kein Geld.', 'La wiki indica que un bote lleno no se vende por más que uno vacío, así que no da dinero.'],
  ["It can't do structural salvage. That needs a salvage ship.", 'Pas de récupération structurelle : il faut un vaisseau de récupération.', 'Keine strukturelle Bergung möglich. Dafür brauchst du ein Bergungsschiff.', 'No sirve para desguace estructural. Para eso hace falta una nave.'],
  ['Rifle-sized tools · large weapon slot', 'Outils de la taille d’un fusil · emplacement d’arme large', 'Werkzeuge in Gewehrgröße · großer Waffenplatz', 'Herramientas del tamaño de un rifle · ranura de arma grande'],
  ['The', 'Le', 'Das', 'El'],
  ["is a dedicated scraping and repair tool. It's faster and holds more than the Cambio-Lite. The", 'est un outil dédié au raclage et à la réparation. Il est plus rapide et contient plus que le Cambio-Lite. Le', 'ist ein eigenes Schabe- und Reparaturwerkzeug. Es ist schneller und fasst mehr als das Cambio-Lite. Der', 'es una herramienta dedicada de raspado y reparación. Es más rápida y guarda más que la Cambio-Lite. El'],
  ['is a heavy tractor beam for moving big components and boxes, even in gravity.', 'est un rayon tracteur lourd pour déplacer de gros composants et caisses, même en gravité.', 'ist ein schwerer Traktorstrahl, um große Komponenten und Kisten zu bewegen, auch bei Schwerkraft.', 'es un rayo tractor pesado para mover componentes y cajas grandes, incluso con gravedad.'],
  ['Neither fits in a backpack. Carry them in a weapon slot.', 'Aucun ne tient dans un sac à dos. Portez-les dans un emplacement d’arme.', 'Keins passt in einen Rucksack. Trag sie in einem Waffenplatz.', 'Ninguna cabe en la mochila. Llévalas en una ranura de arma.'],
  ['A MaxLift is very handy next to a Vulture or Fortune for clearing jammed boxes and loading components.', 'Un MaxLift est très pratique avec un Vulture ou un Fortune pour débloquer les caisses coincées et charger des composants.', 'Ein MaxLift ist neben einer Vulture oder Fortune sehr praktisch, um festsitzende Kisten zu lösen und Komponenten zu laden.', 'Una MaxLift es muy útil junto a una Vulture o Fortune para soltar cajas atascadas y cargar componentes.'],

  // ---------- Cargo Crates ----------
  ["Found cargo crates in a wreck or derelict? Add what's in each crate and how many SCU. You'll see where to sell it all, and how much it's worth.",
    'Vous avez trouvé des caisses dans une épave ou un vaisseau abandonné ? Ajoutez le contenu de chaque caisse et combien de SCU. Vous verrez où tout vendre et combien ça vaut.',
    'Frachtkisten in einem Wrack gefunden? Gib an, was in jeder Kiste ist und wie viele SCU. Du siehst, wo du alles verkaufst und was es wert ist.',
    '¿Has encontrado cajas en un resto o una nave abandonada? Añade qué hay en cada caja y cuántos SCU. Verás dónde venderlo todo y cuánto vale.'],
  ["What's in the crate", 'Contenu de la caisse', 'Inhalt der Kiste', 'Contenido de la caja'],
  ['Search a commodity, e.g. Titanium, Agricium…', 'Cherchez une marchandise, ex. Titanium, Agricium…', 'Ware suchen, z. B. Titanium, Agricium…', 'Busca una mercancía, p. ej. Titanium, Agricium…'],
  ['Remove this crate', 'Retirer cette caisse', 'Diese Kiste entfernen', 'Quitar esta caja'],
  ['+ Add another crate', '+ Ajouter une caisse', '+ Weitere Kiste hinzufügen', '+ Añadir otra caja'],
  ['Unknown commodity. Pick one from the list.', 'Marchandise inconnue. Choisissez-en une dans la liste.', 'Unbekannte Ware. Wähle eine aus der Liste.', 'Mercancía desconocida. Elige una de la lista.'],
  ['Enter how many SCU.', 'Indiquez combien de SCU.', 'Gib an, wie viele SCU.', 'Indica cuántos SCU.'],
  ['No commodity matches. Try another name.', 'Aucune marchandise ne correspond. Essayez un autre nom.', 'Keine Ware passt. Versuch einen anderen Namen.', 'Ninguna mercancía coincide. Prueba otro nombre.'],
  ['⚠ Some of these goods are', '⚠ Certaines de ces marchandises sont', '⚠ Einige dieser Waren sind', '⚠ Algunas de estas mercancías son'],
  ['illegal', 'illégales', 'illegal', 'ilegales'],
  ['. Only some terminals buy them (marked', '. Seuls certains terminaux les achètent (marqués', '. Nur manche Terminals kaufen sie (markiert mit', '. Solo algunas terminales las compran (marcadas'],
  ['), and being scanned with them can get you fined or a CrimeStat.', '), et être scanné avec peut vous valoir une amende ou un CrimeStat.', '), und wenn du damit gescannt wirst, drohen Bußgeld oder CrimeStat.', '), y si te escanean con ellas te pueden multar o darte CrimeStat.'],
  ['Add the crates you found: search what\'s inside and enter how many SCU. Add several crates to find one place that buys them all.', 'Ajoutez les caisses trouvées : cherchez leur contenu et indiquez combien de SCU. Ajoutez-en plusieurs pour trouver un endroit qui achète tout.', 'Füge die gefundenen Kisten hinzu: Suche den Inhalt und gib die SCU an. Füge mehrere hinzu, um einen Ort zu finden, der alles kauft.', 'Añade las cajas que encontraste: busca su contenido e indica cuántos SCU. Añade varias para encontrar un lugar que lo compre todo.'],
  ['Finding and taking crates', 'Trouver et prendre des caisses', 'Kisten finden und mitnehmen', 'Encontrar y llevarse cajas'],
  ['Where to find them', 'Où les trouver', 'Wo du sie findest', 'Dónde encontrarlas'],
  ['Inside and around', 'Dans et autour des', 'In und um', 'Dentro y alrededor de'],
  ['wrecks', 'épaves', 'Wracks', 'restos'],
  [': crashed ships on moons and planets, debris fields, and derelict ships in space.', ' : vaisseaux écrasés sur les lunes et planètes, champs de débris et épaves dans l’espace.', ': abgestürzte Schiffe auf Monden und Planeten, Trümmerfelder und Wracks im All.', ': naves estrelladas en lunas y planetas, campos de escombros y pecios en el espacio.'],
  ['In the wrecks spawned by', 'Dans les épaves créées par les', 'In Wracks, die von', 'En los restos que generan los'],
  ['salvage contracts', 'contrats de récupération', 'Bergungsaufträgen erzeugt werden', 'contratos de chatarrería'],
  ['(see the', '(voir le', '(siehe', '(mira la'],
  ["In the hold of abandoned ships you're salvaging.", 'Dans la soute des vaisseaux abandonnés que vous récupérez.', 'Im Frachtraum verlassener Schiffe, die du birgst.', 'En la bodega de las naves abandonadas que desguazas.'],
  ['How to take them', 'Comment les prendre', 'Wie du sie mitnimmst', 'Cómo llevártelas'],
  ["Look at a crate to see what's inside and its size in SCU.", 'Regardez une caisse pour voir son contenu et sa taille en SCU.', 'Schau eine Kiste an, um Inhalt und Größe in SCU zu sehen.', 'Mira una caja para ver qué contiene y su tamaño en SCU.'],
  ['Move it with a', 'Déplacez-la avec un', 'Bewege sie mit einem', 'Muévela con un'],
  ['tractor beam', 'rayon tracteur', 'Traktorstrahl', 'rayo tractor'],
  [": a multi-tool with the TruHold attachment, a MaxLift, or your ship's tractor beam.", ' : un multi-outil avec l’accessoire TruHold, un MaxLift ou le rayon tracteur de votre vaisseau.', ': einem Multi-Tool mit TruHold-Aufsatz, einem MaxLift oder dem Traktorstrahl deines Schiffs.', ': una multiherramienta con el accesorio TruHold, una MaxLift o el rayo tractor de tu nave.'],
  ["Place it on your ship's cargo grid. Make sure the box size fits your grid.", 'Posez-la sur la grille de soute de votre vaisseau. Vérifiez que la taille de caisse convient.', 'Stell sie auf das Frachtgitter deines Schiffs. Achte darauf, dass die Kistengröße passt.', 'Colócala en la rejilla de carga de tu nave. Asegúrate de que el tamaño de la caja encaje.'],
  ['Fly to a terminal that buys it and sell it from the commodity terminal there.', 'Volez vers un terminal qui l’achète et vendez-la au terminal de marchandises.', 'Flieg zu einem Terminal, das sie kauft, und verkaufe sie dort am Warenterminal.', 'Vuela a una terminal que la compre y véndela en la terminal de mercancías.'],
  ['Is it legal?', 'Est-ce légal ?', 'Ist das legal?', '¿Es legal?'],
  ['Crates from', 'Les caisses d’épaves', 'Kisten aus', 'Las cajas de restos'],
  ['destroyed', 'détruites', 'zerstörten', 'destruidos'],
  ['abandoned', 'abandonnées', 'verlassenen', 'abandonados'],
  ['("Gamerules") or', '(« Gamerules ») ou', '(„Gamerules“) oder', '(«Gamerules») o'],
  ['mission-spawned', 'créées par une mission', 'von Missionen erzeugten', 'generados por misiones'],
  ['wrecks are fair game.', 'sont de bonne prise.', 'Wracks darfst du nehmen.', 'son de libre uso.'],
  ['Taking cargo from a ship another player owns can be a crime.', 'Prendre la cargaison d’un vaisseau appartenant à un autre joueur peut être un crime.', 'Fracht aus dem Schiff eines anderen Spielers zu nehmen, kann eine Straftat sein.', 'Llevarte la carga de una nave de otro jugador puede ser delito.'],
  ["Illegal goods only sell at no-questions-asked terminals, and you can be fined if you're scanned with them.", 'Les marchandises illégales ne se vendent qu’aux terminaux « sans questions », et vous risquez une amende si on vous scanne avec.', 'Illegale Waren verkaufst du nur an „Keine Fragen“-Terminals, und wenn du damit gescannt wirst, droht ein Bußgeld.', 'Las mercancías ilegales solo se venden en terminales «sin preguntas», y te pueden multar si te escanean con ellas.'],
  ['Check the max box size of the sell terminal before you go: small outposts may not take big crates.', 'Vérifiez la taille de caisse max du terminal avant de partir : les petits avant-postes peuvent refuser les grosses caisses.', 'Prüfe vor dem Flug die max. Kistengröße des Terminals: Kleine Außenposten nehmen große Kisten oft nicht.', 'Comprueba el tamaño máximo de caja de la terminal antes de ir: los puestos pequeños pueden no aceptar cajas grandes.'],

  // ---------- Salvage Guide ----------
  ['How salvage works', 'Comment fonctionne la récupération', 'Wie Bergung funktioniert', 'Cómo funciona la chatarrería'],
  ['Step by step', 'Pas à pas', 'Schritt für Schritt', 'Paso a paso'],
  ['Contracts & missions', 'Contrats et missions', 'Aufträge & Missionen', 'Contratos y misiones'],
  ['Staying legal', 'Rester dans la légalité', 'Legal bleiben', 'Mantenerse legal'],
  ['Scraper modules', 'Modules de raclage', 'Schabemodule', 'Módulos de raspado'],
  ['Refining & selling', 'Raffinage et vente', 'Raffinieren & Verkaufen', 'Refinado y venta'],
  ['Where to start', 'Par où commencer', 'Wo anfangen', 'Por dónde empezar'],
  ['Written for', 'Rédigé pour', 'Geschrieben für', 'Escrito para'],
  [". Salvage changes often between patches. If something in-game doesn't match, trust the game and the mission briefing.", '. La récupération change souvent entre les patchs. Si quelque chose ne correspond pas en jeu, fiez-vous au jeu et au briefing de mission.', '. Bergung ändert sich oft zwischen Patches. Wenn im Spiel etwas nicht passt, vertrau dem Spiel und dem Missionsbriefing.', '. La chatarrería cambia a menudo entre parches. Si algo no coincide en el juego, fíate del juego y del informe de la misión.'],
  ['Salvage turns wrecks into aUEC in three ways. You usually do them in this order on the same wreck:', 'La récupération transforme les épaves en aUEC de trois façons. On les fait généralement dans cet ordre sur la même épave :', 'Bergung macht Wracks auf drei Arten zu aUEC. Meist in dieser Reihenfolge am selben Wrack:', 'La chatarrería convierte los restos en aUEC de tres formas. Normalmente se hacen en este orden en el mismo resto:'],
  ['Components & cargo', 'Composants et cargaison', 'Komponenten & Fracht', 'Componentes y carga'],
  ['Use a tractor beam to pull off weapons, shields, power plants, coolers and quantum drives, plus any cargo boxes. Sell them at shops that sell those parts.', 'Utilisez un rayon tracteur pour retirer armes, boucliers, générateurs, refroidisseurs et moteurs quantiques, ainsi que les caisses de cargaison. Vendez-les dans les boutiques qui vendent ces pièces.', 'Zieh mit einem Traktorstrahl Waffen, Schilde, Kraftwerke, Kühler und Quantenantriebe sowie Frachtkisten ab. Verkaufe sie in Shops, die diese Teile führen.', 'Usa un rayo tractor para arrancar armas, escudos, plantas de energía, refrigeradores y motores cuánticos, además de las cajas de carga. Véndelos en tiendas que vendan esas piezas.'],
  ['Hull scraping → RMC', 'Raclage de coque → RMC', 'Hülle abschaben → RMC', 'Raspado del casco → RMC'],
  ['Scraper heads strip the outer plating into', 'Les têtes de raclage transforment le blindage extérieur en', 'Schabeköpfe verwandeln die äußere Panzerung in', 'Los cabezales de raspado convierten el blindaje exterior en'],
  ["Recycled Material Composite (RMC)", 'Recycled Material Composite (RMC)', 'Recycled Material Composite (RMC)', 'Recycled Material Composite (RMC)'],
  [". It's ready to sell as soon as it's boxed.", '. Il est prêt à vendre dès qu’il est en caisse.', '. Es ist verkaufsbereit, sobald es verpackt ist.', '. Está listo para vender en cuanto se empaqueta.'],
  ['Structural salvage → Construction Materials', 'Récupération structurelle → Construction Materials', 'Strukturelle Bergung → Construction Materials', 'Desguace estructural → Construction Materials'],
  ['Fracture', 'Fracturez', 'Zerbrich', 'Fractura'],
  ['the stripped hull into chunks, then', 'la coque mise à nu en morceaux, puis', 'die freigelegte Hülle in Brocken, dann', 'el casco pelado en trozos y luego'],
  ['disintegrate', 'désintégrez', 'desintegriere', 'desintegra'],
  ['the chunks into raw material. Refine it into', 'les morceaux en matériau brut. Raffinez-le en', 'die Brocken zu Rohmaterial. Raffiniere es zu', 'los trozos en material en bruto. Refínalo para obtener'],
  ['Always strip components and scrape first. Fracturing destroys any parts still attached, and RMC left on the chunks is lost.', 'Retirez toujours les composants et raclez d’abord. Fracturer détruit les pièces encore attachées, et le RMC resté sur les morceaux est perdu.', 'Immer zuerst Komponenten abbauen und schaben. Zerlegen zerstört alle noch befestigten Teile, und RMC auf den Brocken geht verloren.', 'Quita siempre los componentes y raspa primero. Fracturar destruye las piezas que sigan montadas, y el RMC que quede en los trozos se pierde.'],
  ['Step by step: salvaging a wreck', 'Pas à pas : récupérer une épave', 'Schritt für Schritt: ein Wrack bergen', 'Paso a paso: desguazar un resto'],
  ['Find a wreck.', 'Trouvez une épave.', 'Finde ein Wrack.', 'Encuentra un resto.'],
  ['Take a salvage contract (see below), or find an abandoned or destroyed ship near busy areas and points of interest.', 'Prenez un contrat de récupération (voir plus bas), ou trouvez un vaisseau abandonné ou détruit près des zones fréquentées et des points d’intérêt.', 'Nimm einen Bergungsauftrag an (siehe unten) oder finde ein verlassenes oder zerstörtes Schiff nahe belebten Gebieten und Points of Interest.', 'Acepta un contrato de chatarrería (ver abajo) o busca una nave abandonada o destruida cerca de zonas concurridas y puntos de interés.'],
  ['Scan it.', 'Scannez-la.', 'Scanne es.', 'Escanéalo.'],
  ['If the owner shows', 'Si le propriétaire affiche', 'Zeigt der Besitzer', 'Si el dueño muestra'],
  ['"Gamerules"', '« Gamerules »', '„Gamerules“', '«Gamerules»'],
  [", it's abandoned and safe to salvage. If a player's name shows, salvaging it can get you a CrimeStat.", ', elle est abandonnée et vous pouvez la récupérer sans risque. Si le nom d’un joueur s’affiche, la récupérer peut vous valoir un CrimeStat.', ', ist es verlassen und sicher zu bergen. Steht dort ein Spielername, kann dir die Bergung einen CrimeStat einbringen.', ', está abandonado y puedes desguazarlo sin riesgo. Si aparece el nombre de un jugador, desguazarlo puede darte CrimeStat.'],
  ['Make it safe.', 'Sécurisez-la.', 'Mach es sicher.', 'Hazlo seguro.'],
  ["You can't scrape a ship that still has shields up. To fracture an intact ship, its power must be off. Board it and shut it down, or use distortion damage.", 'Impossible de racler un vaisseau dont les boucliers sont actifs. Pour fracturer un vaisseau intact, il doit être hors tension. Montez à bord pour l’éteindre, ou utilisez des dégâts de distorsion.', 'Ein Schiff mit aktiven Schilden kannst du nicht abschaben. Um ein intaktes Schiff zu zerlegen, muss es ohne Energie sein. Geh an Bord und schalte es ab oder nutze Distortion-Schaden.', 'No puedes raspar una nave con los escudos activos. Para fracturar una nave intacta debe estar sin energía. Sube a bordo y apágala, o usa daño de distorsión.'],
  ['Strip the valuables.', 'Prenez les objets de valeur.', 'Hol die Wertsachen.', 'Llévate lo valioso.'],
  ['Use a tractor beam to detach components. On a non-destroyed ship, the pilot seat has to unlock the ports first. Load them and any cargo boxes into your hold.', 'Utilisez un rayon tracteur pour détacher les composants. Sur un vaisseau non détruit, il faut d’abord déverrouiller les emplacements depuis le siège pilote. Chargez-les avec les caisses dans votre soute.', 'Löse Komponenten mit einem Traktorstrahl. Bei einem nicht zerstörten Schiff müssen die Ports erst am Pilotensitz entriegelt werden. Lade sie und alle Frachtkisten in deinen Frachtraum.', 'Usa un rayo tractor para soltar los componentes. En una nave no destruida, primero hay que desbloquear los puertos desde el asiento del piloto. Cárgalos junto con las cajas en tu bodega.'],
  ['Scrape the hull.', 'Raclez la coque.', 'Schabe die Hülle ab.', 'Raspa el casco.'],
  ['Switch to salvage mode (default key', 'Passez en mode récupération (touche par défaut', 'Wechsle in den Bergungsmodus (Standardtaste', 'Cambia al modo chatarrería (tecla por defecto'],
  ['on most salvage ships, check', 'sur la plupart des vaisseaux de récupération, voir', 'auf den meisten Bergungsschiffen, siehe', 'en la mayoría de naves de chatarrería, mira'],
  ['Options → Keybindings', 'Options → Raccourcis', 'Optionen → Tastenbelegung', 'Opciones → Controles'],
  ['). Sweep the beams over the plating until the panels are bare. Watch your material buffer.', '). Balayez le blindage jusqu’à ce que les panneaux soient à nu. Surveillez votre tampon de matière.', '). Führe die Strahlen über die Panzerung, bis die Platten blank sind. Behalte deinen Materialpuffer im Blick.', '). Pasa los haces por el blindaje hasta que los paneles queden pelados. Vigila tu búfer de material.'],
  ['Box it up.', 'Mettez en caisses.', 'Verpacke es.', 'Empaquétalo.'],
  ['When the buffer fills, the ship packs material into SCU boxes on its cargo grid or external rack. Keep space free or the process stops.', 'Quand le tampon est plein, le vaisseau met la matière en caisses SCU sur sa grille ou son rack externe. Gardez de la place, sinon le processus s’arrête.', 'Ist der Puffer voll, packt das Schiff das Material in SCU-Kisten auf sein Frachtgitter oder Außengestell. Halte Platz frei, sonst stoppt der Vorgang.', 'Cuando el búfer se llena, la nave empaqueta el material en cajas SCU en su rejilla o soporte externo. Deja espacio libre o el proceso se detiene.'],
  ['Fracture & disintegrate', 'Fracturez et désintégrez', 'Zerlegen & desintegrieren', 'Fractura y desintegra'],
  ["(optional, if your ship can handle the wreck's size). Break the hull into chunks, then disintegrate them into raw construction material.", '(facultatif, si votre vaisseau gère la taille de l’épave). Brisez la coque en morceaux, puis désintégrez-les en matériau de construction brut.', '(optional, wenn dein Schiff die Wrackgröße schafft). Zerbrich die Hülle in Brocken und desintegriere sie zu rohem Baumaterial.', '(opcional, si tu nave puede con el tamaño del resto). Rompe el casco en trozos y desintégralos en material de construcción en bruto.'],
  ['Sell and refine.', 'Vendez et raffinez.', 'Verkaufen und raffinieren.', 'Vende y refina.'],
  ['Sell RMC and components. Take raw construction material to a refinery, then sell the Construction Materials. Use', 'Vendez le RMC et les composants. Apportez le matériau de construction brut à une raffinerie, puis vendez les Construction Materials. Utilisez', 'Verkaufe RMC und Komponenten. Bring rohes Baumaterial zu einer Raffinerie und verkaufe dann die Construction Materials. Nutze', 'Vende el RMC y los componentes. Lleva el material de construcción en bruto a una refinería y luego vende los Construction Materials. Usa'],
  ['to find the best stop.', 'pour trouver le meilleur arrêt.', ', um den besten Halt zu finden.', 'para encontrar la mejor parada.'],
  ['Salvage contracts & missions', 'Contrats et missions de récupération', 'Bergungsaufträge & Missionen', 'Contratos y misiones de chatarrería'],
  ['Open your', 'Ouvrez votre', 'Öffne dein', 'Abre tu'],
  ['mobiGlas → Contracts', 'mobiGlas → Contrats', 'mobiGlas → Aufträge', 'mobiGlas → Contratos'],
  ['and select the', 'et sélectionnez l’onglet', 'und wähle den Tab', 'y elige la pestaña'],
  ['Salvage', 'Salvage', 'Salvage', 'Salvage'],
  ['tab. There are two families of contracts:', '. Il existe deux familles de contrats :', '. Es gibt zwei Arten von Aufträgen:', '. Hay dos familias de contratos:'],
  ['Wreck contracts', 'Contrats d’épave', 'Wrackaufträge', 'Contratos de restos'],
  ['The contract spawns one or more wrecks and gives you their location. You keep everything you salvage. Some versions:', 'Le contrat fait apparaître une ou plusieurs épaves et vous donne leur position. Vous gardez tout ce que vous récupérez. Quelques variantes :', 'Der Auftrag erzeugt ein oder mehrere Wracks und gibt dir ihre Position. Du behältst alles, was du birgst. Einige Varianten:', 'El contrato genera uno o varios restos y te da su ubicación. Te quedas con todo lo que desguaces. Algunas versiones:'],
  ['Salvage rights (legal):', 'Droits de récupération (légal) :', 'Bergungsrechte (legal):', 'Derechos de desguace (legal):'],
  ["a wreck you're allowed to salvage, usually with no time pressure. Best for learning.", 'une épave que vous avez le droit de récupérer, en général sans limite de temps. Idéal pour apprendre.', 'ein Wrack, das du bergen darfst, meist ohne Zeitdruck. Am besten zum Lernen.', 'un resto que puedes desguazar, normalmente sin prisas. Ideal para aprender.'],
  ['Timed or risky jobs:', 'Missions chronométrées ou risquées :', 'Zeitlich begrenzte oder riskante Jobs:', 'Trabajos con tiempo o riesgo:'],
  ['bigger wrecks with a countdown before security or pirates show up. Some pay a bonus for stripping the wreck enough or towing it away.', 'des épaves plus grandes avec un compte à rebours avant l’arrivée de la sécurité ou des pirates. Certaines paient un bonus si vous dépouillez assez l’épave ou si vous la remorquez.', 'größere Wracks mit Countdown, bevor Sicherheitsdienst oder Piraten auftauchen. Manche zahlen einen Bonus, wenn du das Wrack genug ausschlachtest oder abschleppst.', 'restos más grandes con cuenta atrás antes de que lleguen la seguridad o los piratas. Algunos pagan un extra por desguazar lo suficiente o remolcarlo.'],
  ['Multi-wreck events:', 'Événements à plusieurs épaves :', 'Mehrfach-Wrack-Events:', 'Eventos con varios restos:'],
  ['several large wrecks, often in lawless space. They can be shared with a crew.', 'plusieurs grandes épaves, souvent en zone sans loi. Elles peuvent être partagées avec un équipage.', 'mehrere große Wracks, oft in gesetzlosem Raum. Sie lassen sich mit einer Crew teilen.', 'varios restos grandes, a menudo en espacio sin ley. Se pueden compartir con una tripulación.'],
  ['Delivery contracts', 'Contrats de livraison', 'Lieferaufträge', 'Contratos de entrega'],
  ['The contract asks you to deliver a set amount of salvaged material (RMC or Construction Materials) and/or components to a location. You get paid on delivery.', 'Le contrat vous demande de livrer une quantité donnée de matière récupérée (RMC ou Construction Materials) et/ou des composants à un endroit. Vous êtes payé à la livraison.', 'Der Auftrag verlangt, eine bestimmte Menge Bergungsmaterial (RMC oder Construction Materials) und/oder Komponenten an einen Ort zu liefern. Bezahlt wird bei Lieferung.', 'El contrato te pide entregar una cantidad fija de material recuperado (RMC o Construction Materials) y/o componentes en un lugar. Cobras al entregar.'],
  ['Check the amount and destination before you accept, and make sure your hold fits it.', 'Vérifiez la quantité et la destination avant d’accepter, et assurez-vous que votre soute suffit.', 'Prüfe Menge und Ziel vor dem Annehmen und ob dein Frachtraum reicht.', 'Comprueba la cantidad y el destino antes de aceptar, y que te cabe en la bodega.'],
  ["Material you salvaged for a delivery contract can't also be sold, so compare the reward with the", 'La matière récupérée pour un contrat de livraison ne peut pas aussi être vendue : comparez la récompense avec la', 'Material für einen Lieferauftrag kannst du nicht zusätzlich verkaufen, also vergleiche die Belohnung mit dem', 'El material que entregas en un contrato no se puede vender aparte, así que compara la recompensa con el'],
  ['sale value', 'valeur de vente', 'Verkaufswert', 'valor de venta'],
  ['How to complete a wreck contract', 'Comment terminer un contrat d’épave', 'So schließt du einen Wrackauftrag ab', 'Cómo completar un contrato de restos'],
  ['Read the briefing: the location, the wreck size, any time limit, and whether it\'s legal. Some contracts charge an entry fee, so check it against what the wreck is worth.', 'Lisez le briefing : le lieu, la taille de l’épave, une éventuelle limite de temps, et si c’est légal. Certains contrats ont des frais d’entrée : comparez-les à la valeur de l’épave.', 'Lies das Briefing: Ort, Wrackgröße, Zeitlimit und ob es legal ist. Manche Aufträge kosten Gebühr, vergleiche sie mit dem Wert des Wracks.', 'Lee el informe: la ubicación, el tamaño del resto, si hay límite de tiempo y si es legal. Algunos contratos cobran una tarifa de entrada, así que compárala con lo que vale el resto.'],
  ['Accept it, set the marker as your route, and quantum to it.', 'Acceptez-le, définissez le marqueur comme itinéraire et faites un saut quantique.', 'Nimm ihn an, setz den Marker als Route und spring per Quantum hin.', 'Acéptalo, fija el marcador como ruta y viaja en cuántico.'],
  ['Approach slowly and scan for other players or NPCs before you stop.', 'Approchez lentement et scannez pour repérer d’autres joueurs ou PNJ avant de vous arrêter.', 'Nähere dich langsam und scanne nach anderen Spielern oder NPCs, bevor du anhältst.', 'Acércate despacio y busca otros jugadores o PNJ con el escáner antes de detenerte.'],
  ['Follow', 'Suivez', 'Befolge', 'Sigue'],
  ['the steps above', 'les étapes ci-dessus', 'die Schritte oben', 'los pasos de arriba'],
  [': components, then scraping, then fracturing if your ship can.', ' : composants, puis raclage, puis fracturation si votre vaisseau le peut.', ': Komponenten, dann Schaben, dann Zerlegen, wenn dein Schiff das kann.', ': componentes, luego raspado y luego fracturación si tu nave puede.'],
  ["If there's a timer, prioritise the most valuable parts and leave before it runs out.", 'S’il y a un chrono, privilégiez les pièces les plus précieuses et partez avant la fin.', 'Gibt es einen Timer, nimm zuerst die wertvollsten Teile und verschwinde, bevor er abläuft.', 'Si hay temporizador, prioriza las piezas más valiosas y vete antes de que acabe.'],
  ["Fly to a sell point and sell. Don't log off with loose material in your hold. It may not survive a server crash.", 'Volez vers un point de vente et vendez. Ne vous déconnectez pas avec de la matière en vrac dans la soute : elle peut ne pas survivre à un crash serveur.', 'Flieg zu einem Verkaufspunkt und verkaufe. Logg dich nicht mit losem Material im Frachtraum aus. Es überlebt einen Serverabsturz eventuell nicht.', 'Vuela a un punto de venta y vende. No te desconectes con material suelto en la bodega: puede no sobrevivir a una caída del servidor.'],
  ['Contract names, fees and rewards change between patches and regions. The briefing is always the reference.', 'Les noms, frais et récompenses des contrats changent selon les patchs et les régions. Le briefing fait toujours foi.', 'Namen, Gebühren und Belohnungen von Aufträgen ändern sich je nach Patch und Region. Das Briefing ist immer maßgeblich.', 'Los nombres, tarifas y recompensas cambian entre parches y regiones. El informe siempre manda.'],
  ['Fracturing a ship counts the same as destroying it with weapons. You avoid fines and CrimeStat if the ship:', 'Fracturer un vaisseau compte comme le détruire avec des armes. Vous évitez amendes et CrimeStat si le vaisseau :', 'Ein Schiff zu zerlegen zählt wie es mit Waffen zu zerstören. Du vermeidest Bußgeld und CrimeStat, wenn das Schiff:', 'Fracturar una nave cuenta igual que destruirla con armas. Evitas multas y CrimeStat si la nave:'],
  ['is already destroyed,', 'est déjà détruit,', 'bereits zerstört ist,', 'ya está destruida,'],
  ['belongs to someone with CrimeStat 3 or more, or', 'appartient à quelqu’un avec un CrimeStat de 3 ou plus, ou', 'jemandem mit CrimeStat 3 oder höher gehört, oder', 'pertenece a alguien con CrimeStat 3 o más, o'],
  ['has', 'a', 'als Besitzer', 'tiene'],
  ['as its owner (abandoned),', 'comme propriétaire (abandonné),', 'hat (verlassen),', 'como dueño (abandonada),'],
  ['has no owner (spawned by a mission),', 'n’a pas de propriétaire (créé par une mission),', 'keinen Besitzer hat (von einer Mission erzeugt),', 'no tiene dueño (generada por una misión),'],
  ['is somewhere with no comm link (outside monitored space, or with the local comm array down).', 'se trouve sans liaison comm (hors de l’espace surveillé, ou avec le relais comm local hors service).', 'sich ohne Comm-Verbindung befindet (außerhalb überwachten Raums oder bei ausgefallenem Comm-Array).', 'está en un sitio sin enlace de comunicaciones (fuera del espacio vigilado o con el repetidor local caído).'],
  ['⚠ Salvaging any non-destroyed ship inside an', '⚠ Récupérer un vaisseau non détruit dans une', '⚠ Ein nicht zerstörtes Schiff in einer', '⚠ Desguazar cualquier nave no destruida dentro de una'],
  ['Armistice Zone', 'zone d’armistice', 'Waffenstillstandszone', 'zona de armisticio'],
  [', even an abandoned one, gets you an Armistice Violation fine and a CrimeStat.', ', même abandonné, vous vaut une amende pour violation d’armistice et un CrimeStat.', ' zu bergen, selbst ein verlassenes, bringt dir ein Bußgeld wegen Waffenstillstandsverletzung und einen CrimeStat.', ', aunque esté abandonada, te cuesta una multa por violar el armisticio y CrimeStat.'],
  ['The scraper heads on salvage ships can be swapped. Trade speed against how much RMC you keep:', 'Les têtes de raclage des vaisseaux de récupération sont interchangeables. Choisissez entre vitesse et quantité de RMC conservée :', 'Die Schabeköpfe von Bergungsschiffen sind austauschbar. Wäge Tempo gegen behaltenes RMC ab:', 'Los cabezales de raspado se pueden cambiar. Elige entre velocidad y cuánto RMC conservas:'],
  ['Module', 'Module', 'Modul', 'Módulo'],
  ['Speed', 'Vitesse', 'Tempo', 'Velocidad'],
  ['Radius', 'Rayon', 'Radius', 'Radio'],
  ['Efficiency', 'Efficacité', 'Effizienz', 'Eficiencia'],
  ['Best for', 'Idéal pour', 'Am besten für', 'Ideal para'],
  ['All-rounder, good default', 'Polyvalent, bon choix par défaut', 'Allrounder, gute Standardwahl', 'Todoterreno, buena opción por defecto'],
  ['Keeping all the material, precise work', 'Garder toute la matière, travail précis', 'Alles Material behalten, präzise Arbeit', 'Conservar todo el material, trabajo preciso'],
  ['Fast, narrow beam', 'Rapide, faisceau étroit', 'Schnell, schmaler Strahl', 'Rápido, haz estrecho'],
  ['Fastest with no waste, very narrow', 'Le plus rapide sans perte, très étroit', 'Am schnellsten ohne Verlust, sehr schmal', 'El más rápido sin pérdidas, muy estrecho'],
  ['Huge area, but loses a lot of material', 'Très grande zone, mais perd beaucoup de matière', 'Riesige Fläche, verliert aber viel Material', 'Área enorme, pero pierde mucho material'],
  ['Values from the Star Citizen wiki. Higher efficiency means more of the scraped plating becomes RMC.', 'Valeurs du wiki Star Citizen. Plus l’efficacité est haute, plus le blindage raclé devient du RMC.', 'Werte aus dem Star-Citizen-Wiki. Höhere Effizienz heißt, mehr der abgeschabten Panzerung wird zu RMC.', 'Valores de la wiki de Star Citizen. Más eficiencia significa que más blindaje raspado se convierte en RMC.'],
  ['is ready to sell once it\'s boxed.', 'est prêt à vendre dès qu’il est en caisse.', 'ist verkaufsbereit, sobald es verpackt ist.', 'está listo para vender en cuanto se empaqueta.'],
  ['Structural salvage', 'La récupération structurelle', 'Strukturelle Bergung', 'El desguace estructural'],
  ['gives raw material that has to be', 'donne du matériau brut qui doit être', 'liefert Rohmaterial, das zu Construction Materials', 'da material en bruto que hay que'],
  ['refined', 'raffiné', 'raffiniert', 'refinar'],
  ['into Construction Materials. Light ships produce', 'en Construction Materials. Les vaisseaux légers produisent du', 'werden muss. Leichte Schiffe erzeugen', 'para obtener Construction Materials. Las naves ligeras producen'],
  ['(fast to refine, lowest yield), the MOTH produces', '(rapide à raffiner, rendement le plus bas), le MOTH produit des', '(schnell zu raffinieren, geringste Ausbeute), die MOTH erzeugt', '(rápido de refinar, menor rendimiento), la MOTH produce'],
  [', and the Reclaimer produces', ', et le Reclaimer produit du', ', und der Reclaimer erzeugt', ', y la Reclaimer produce'],
  ['(slowest, highest yield).', '(le plus lent, meilleur rendement).', '(am langsamsten, höchste Ausbeute).', '(lo más lento, mayor rendimiento).'],
  ['RMC and Construction Materials sell at', 'Le RMC et les Construction Materials se vendent aux bureaux', 'RMC und Construction Materials verkaufst du in', 'El RMC y los Construction Materials se venden en las oficinas'],
  ['offices in cities,', 'des villes,', '-Büros in Städten,', 'de las ciudades,'],
  [', many stations, and salvage yards. Grim HEX and salvage yards usually pay less but ask fewer questions.', ', dans beaucoup de stations et dans les casses. Grim HEX et les casses paient en général moins mais posent moins de questions.', ', vielen Stationen und auf Schrottplätzen. Grim HEX und Schrottplätze zahlen meist weniger, fragen aber weniger nach.', ', muchas estaciones y desguaces. Grim HEX y los desguaces suelen pagar menos pero hacen menos preguntas.'],
  ['Components sell at shops that sell that same part.', 'Les composants se vendent dans les boutiques qui vendent cette même pièce.', 'Komponenten verkaufst du in Shops, die dasselbe Teil führen.', 'Los componentes se venden en tiendas que venden esa misma pieza.'],
  ['Check the', 'Vérifiez la', 'Prüfe die', 'Comprueba el'],
  ['max box size', 'taille de caisse max', 'max. Kistengröße', 'tamaño máximo de caja'],
  ['of the sell terminal. Small outposts may not take 16 or 32 SCU boxes.', 'du terminal de vente. Les petits avant-postes peuvent refuser les caisses de 16 ou 32 SCU.', 'des Verkaufsterminals. Kleine Außenposten nehmen 16- oder 32-SCU-Kisten eventuell nicht.', 'de la terminal de venta. Los puestos pequeños pueden no aceptar cajas de 16 o 32 SCU.'],
  ['On foot:', 'À pied :', 'Zu Fuß:', 'A pie:'],
  ['a multi-tool with Cambio-Lite and TruHold attachments, to learn scraping and moving parts.', 'un multi-outil avec les accessoires Cambio-Lite et TruHold, pour apprendre le raclage et le déplacement de pièces.', 'ein Multi-Tool mit Cambio-Lite- und TruHold-Aufsätzen, um Schaben und Teile bewegen zu lernen.', 'una multiherramienta con los accesorios Cambio-Lite y TruHold, para aprender a raspar y mover piezas.'],
  ['First ship:', 'Premier vaisseau :', 'Erstes Schiff:', 'Primera nave:'],
  ['an', 'un', 'eine', 'una'],
  ['or', 'ou', 'oder', 'o'],
  ['. Take legal salvage contracts and sell RMC.', '. Prenez des contrats légaux et vendez du RMC.', '. Nimm legale Bergungsaufträge an und verkaufe RMC.', '. Acepta contratos legales y vende RMC.'],
  ['With friends:', 'Entre amis :', 'Mit Freunden:', 'Con amigos:'],
  ['for big wrecks and structural salvage. Split pilot, scraping, tractor and cargo duties.', 'pour les grosses épaves et la récupération structurelle. Répartissez pilotage, raclage, tracteur et soute.', 'für große Wracks und strukturelle Bergung. Teilt Pilot, Schaben, Traktor und Fracht auf.', 'para restos grandes y desguace estructural. Repartid piloto, raspado, tractor y carga.'],
  ['Sources:', 'Sources :', 'Quellen:', 'Fuentes:'],
  ['Star Citizen Wiki: Salvaging', 'Star Citizen Wiki : Salvaging', 'Star Citizen Wiki: Salvaging', 'Star Citizen Wiki: Salvaging'],
  ['Star Citizen Help: salvaging career', 'Star Citizen Help : carrière de récupération', 'Star Citizen Help: Bergungskarriere', 'Star Citizen Help: carrera de chatarrería'],
  ['Timesaver.gg salvage guide (4.10)', 'Guide de récupération Timesaver.gg (4.10)', 'Timesaver.gg-Bergungsleitfaden (4.10)', 'Guía de chatarrería de Timesaver.gg (4.10)'],

  // ---------- footer ----------
  ['Data:', 'Données :', 'Daten:', 'Datos:'],
  ['community reports, refreshed every 15 minutes. Prices and stock are reported by players, so check the "reported" age before a long haul. This site never connects to or modifies the game.',
    'relevés de la communauté, actualisés toutes les 15 minutes. Les prix et stocks sont signalés par les joueurs : vérifiez l’âge du relevé avant un long trajet. Ce site ne se connecte jamais au jeu et ne le modifie pas.',
    'Community-Meldungen, alle 15 Minuten aktualisiert. Preise und Bestände werden von Spielern gemeldet, prüfe also vor einer langen Tour das Alter der Meldung. Diese Seite verbindet sich nie mit dem Spiel und verändert es nicht.',
    'reportes de la comunidad, actualizados cada 15 minutos. Los precios y el stock los reportan los jugadores, así que mira la antigüedad del reporte antes de un viaje largo. Este sitio nunca se conecta al juego ni lo modifica.'],
  ['This is an unofficial Star Citizen fansite, not affiliated with the Cloud Imperium group of companies. All content on this site not authored by its host or users are property of their respective owners.',
    'Ceci est un site de fans non officiel de Star Citizen, non affilié au groupe Cloud Imperium. Tout contenu de ce site non rédigé par son hébergeur ou ses utilisateurs appartient à ses propriétaires respectifs.',
    'Dies ist eine inoffizielle Star-Citizen-Fanseite, nicht mit der Cloud-Imperium-Unternehmensgruppe verbunden. Alle Inhalte dieser Seite, die nicht vom Betreiber oder den Nutzern stammen, gehören ihren jeweiligen Eigentümern.',
    'Este es un sitio de fans no oficial de Star Citizen, sin relación con el grupo de empresas Cloud Imperium. Todo el contenido de este sitio que no sea de su autor o de sus usuarios pertenece a sus respectivos propietarios.'],
];

// ---------- engine ----------

let lang = (() => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch (e) {}
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return LANGS.includes(nav) ? nav : 'en';
})();

const exact = {};     // lang -> Map(English -> translation)
const patterns = {};  // lang -> [{ re, keys, out }]
const cache = {};     // lang -> Map(English -> translation or null)
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

LANGS.slice(1).forEach((l, i) => {
  exact[l] = new Map();
  patterns[l] = [];
  cache[l] = new Map();
  for (const row of STRINGS) {
    const en = row[0], out = row[i + 1];
    if (!out) continue;
    if (!/\{(\d+|n\d*)\}/.test(en)) { exact[l].set(en, out); continue; }
    const keys = [];
    const re = new RegExp('^' + en.split(/(\{(?:\d+|n\d*)\})/).map((part) => {
      const m = part.match(/^\{(\d+|n\d*)\}$/);
      if (!m) return escapeRe(part);
      keys.push(m[1]);
      return m[1].startsWith('n') ? '([+−-]?\\d[\\d,.]*)' : '(.+?)';
    }).join('') + '$');
    patterns[l].push({ re, keys, out, weight: en.replace(/\{[^}]*\}/g, '').length });
  }
  // Try the most specific patterns first.
  patterns[l].sort((a, b) => b.weight - a.weight);
});

// Returns the translation of an English string, or null when there's none.
function translate(text, l = lang) {
  if (l === 'en' || !text || !/[A-Za-z]/.test(text)) return null;
  const c = cache[l];
  if (c.has(text)) return c.get(text);
  let out = exact[l].get(text) ?? null;
  if (out == null) {
    for (const p of patterns[l]) {
      const m = text.match(p.re);
      if (!m) continue;
      const vals = {};
      p.keys.forEach((k, i) => { vals[k] = m[i + 1]; });
      out = p.out.replace(/\{(\d+|n\d*)\}/g, (_, k) => (k.startsWith('n') ? vals[k] : translate(vals[k], l) ?? vals[k]));
      break;
    }
  }
  if (out == null && text.includes(' · ')) {
    const parts = text.split(' · ').map((s) => translate(s, l) ?? s);
    out = parts.join(' · ');
  }
  if (out == null && /[.!?:] \S/.test(text)) {
    const parts = text.split(/(?<=[.!?:]) (?=\S)/);
    if (parts.length > 1) out = parts.map((s) => translate(s, l) ?? s).join(' ');
  }
  if (out === text) out = null;
  c.set(text, out);
  return out;
}

// English text of each translated node and attribute, so switching back (or to another language) works.
const textOrig = new WeakMap();  // node -> { en, shown }
const attrOrig = new WeakMap();  // element -> { attr: { en, shown } }
const ATTRS = ['title', 'placeholder', 'aria-label'];
const SKIP = 'script, style, textarea, #lang-select, [data-no-i18n]';

function localiseText(node) {
  const parent = node.parentElement;
  if (!parent || parent.closest(SKIP)) return;
  const value = node.nodeValue;
  let rec = textOrig.get(node);
  if (!rec || value !== rec.shown) rec = { en: value };
  const core = rec.en.trim();
  const tr = core ? translate(core.replace(/\s+/g, ' ')) : null;
  const shown = tr == null ? rec.en : rec.en.replace(core, tr);
  rec.shown = shown;
  textOrig.set(node, rec);
  if (value !== shown) node.nodeValue = shown;
}

function localiseAttrs(el) {
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const value = el.getAttribute(a);
    const all = attrOrig.get(el) || {};
    let rec = all[a];
    if (!rec || value !== rec.shown) rec = { en: value };
    const tr = translate(rec.en.trim().replace(/\s+/g, ' '));
    rec.shown = tr ?? rec.en;
    all[a] = rec;
    attrOrig.set(el, all);
    if (value !== rec.shown) el.setAttribute(a, rec.shown);
  }
}

function localise(root) {
  if (root.nodeType === Node.TEXT_NODE) return localiseText(root);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (root.closest(SKIP)) return;
  localiseAttrs(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeType === Node.TEXT_NODE) localiseText(n);
    else localiseAttrs(n);
  }
}

// Text the scripts write later (tables, cards, the countdown) is translated as it appears.
const observer = new MutationObserver((records) => {
  for (const r of records) {
    if (r.type === 'characterData') localiseText(r.target);
    else if (r.type === 'attributes') localiseAttrs(r.target);
    else r.addedNodes.forEach(localise);
  }
});

function setLanguage(l) {
  lang = LANGS.includes(l) ? l : 'en';
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  document.documentElement.lang = lang;
  const select = document.getElementById('lang-select');
  if (select) select.value = lang;
  localise(document.body);
}

document.getElementById('lang-select')?.addEventListener('change', (e) => setLanguage(e.target.value));
setLanguage(lang);
observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
