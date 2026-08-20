// Legal documents — content extracted from client-supplied PDFs (2026-08-20).
// 4 documents × 5 locales. Each doc is an array of sections { heading, body }.
// body is an array of paragraphs (strings). Some paragraphs contain a cookie
// table, marked with a special "table" key for the modal to render.

export type LegalSection = {
  heading: string;
  body: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
};

export type LegalDoc = {
  title: string;
  sections: LegalSection[];
};

export type LegalLocale = "en" | "es" | "ca" | "it" | "el";

// ── English ──────────────────────────────────────────────────────────────────

const en_legal: LegalDoc = {
  title: "Legal Notice",
  sections: [
    {
      heading: "1. Company details",
      body: [
        "In compliance with Article 10 of Spanish Law 34/2002, of 11 July, on Information Society Services and Electronic Commerce (LSSI-CE), the details of the owner of this website are provided below:",
        "Owner: Oli Gerpifi, S.L.\nTax ID (NIF): B43445766\nRegistered office: Polígono Pla de Solans, 22/23, 43519 El Perelló (Tarragona), Spain\nEmail: office@nostrumoils.com\nPhone: +34 680 889 399\nWebsite: https://nostrumoils.com",
      ],
    },
    {
      heading: "2. Purpose",
      body: [
        "This Legal Notice governs access to, browsing of and use of the website nostrumoils.com, through which the owner sells extra virgin olive oil and provides informational content about its products and activity.",
        "Access to the website is free of charge and gives anyone who uses it the status of user. Browsing the website implies acceptance of the conditions set out in this Legal Notice. If the user does not agree with them, they must refrain from using the website.",
      ],
    },
    {
      heading: "3. Conditions of use",
      body: [
        "The user undertakes to make appropriate and lawful use of the website and its content, in accordance with applicable law, this Legal Notice and good practice. In particular, the user undertakes not to use the website for unlawful or harmful purposes, nor to carry out any action that may damage, disable, overload or impair its normal operation.",
        "The owner may modify the design, presentation and configuration of the website, as well as its content and access conditions, at any time and without prior notice.",
      ],
    },
    {
      heading: "4. Intellectual and industrial property",
      body: [
        "All content on the website (texts, photographs, graphics, images, design, logos, trade names, trademarks and source code) is the property of the owner or of third parties who have authorised its use, and is protected by intellectual and industrial property law.",
        "The reproduction, distribution, public communication, transformation or any other form of exploitation, in whole or in part, of the website's content without the owner's prior written authorisation is prohibited. Access to the website does not grant the user any ownership rights over the content.",
      ],
    },
    {
      heading: "5. Liability",
      body: [
        "The owner works to ensure the availability and proper functioning of the website, but cannot guarantee the absence of interruptions or errors in access, nor that the content is always up to date. To the extent permitted by law, the owner is not liable for any damage arising from the lack of availability or continuity of the website.",
        "The website may contain links to third-party sites. The owner assumes no responsibility for the content, services or policies of such sites, access to which is the user's sole decision and responsibility.",
      ],
    },
    {
      heading: "6. Data protection",
      body: [
        "The processing of users' personal data is governed by this website's Privacy Policy, which forms part of this Legal Notice and which the user should read carefully.",
      ],
    },
    {
      heading: "7. Applicable law and jurisdiction",
      body: [
        "This Legal Notice is governed by Spanish law. For the resolution of any dispute arising from access to or use of the website, the parties submit to the courts and tribunals with jurisdiction under applicable law, in all cases respecting the rights that consumer protection law grants to consumers and users.",
        "Last updated: 20 August 2026",
      ],
    },
  ],
};

const en_privacy: LegalDoc = {
  title: "Privacy Policy",
  sections: [
    {
      heading: "",
      body: [
        "At Oli Gerpifi, S.L. we take the privacy of our users and customers seriously. This Privacy Policy explains what personal data we process, for what purpose, on what legal basis and what rights you have, in accordance with Regulation (EU) 2016/679 (GDPR) and Spanish Organic Law 3/2018 on the Protection of Personal Data and the guarantee of digital rights (LOPDGDD).",
      ],
    },
    {
      heading: "1. Data controller",
      body: [
        "Controller: Oli Gerpifi, S.L.\nTax ID (NIF): B43445766\nAddress: Polígono Pla de Solans, 22/23, 43519 El Perelló (Tarragona), Spain\nEmail: office@nostrumoils.com\nPhone: +34 680 889 399",
      ],
    },
    {
      heading: "2. Data we process and purposes",
      body: [
        "We process the personal data you provide through the website, depending on how you use it:",
        "a) Customer account. When you register, we process your name, surname, email address and password in order to create and manage your account and give you access to your private area, your order history and your data.",
        "b) Orders and payments. When you make a purchase, we process your identifying and contact details, shipping and billing address, and the data needed to process the order. Payment is handled through the Stripe payment gateway; the controller never stores your full card details.",
        "c) Contact form and enquiries. When you write to us through the contact form or by email, we process the data you provide (name, email and the content of your message) in order to handle and respond to your enquiry.",
        "d) Web analytics. We use Google Analytics to understand, on a statistical basis, how the website is used and to improve it. This data is only processed if you give your consent through the cookie banner. You can find the details in our Cookie Policy.",
      ],
    },
    {
      heading: "3. Legal basis for processing",
      body: [
        "Customer account and management of orders and payments: performance of a contract to which you are a party (Art. 6(1)(b) GDPR).",
        "Invoicing and accounting and tax obligations: compliance with legal obligations (Art. 6(1)(c) GDPR).",
        "Handling enquiries: your consent or the legitimate interest in assisting you (Art. 6(1)(a) and 6(1)(f) GDPR).",
        "Web analytics through cookies: your consent (Art. 6(1)(a) GDPR).",
      ],
    },
    {
      heading: "4. Retention periods",
      body: [
        "We keep your data for as long as the relationship with the controller is maintained (for example, while you have a customer account) and, once it has ended, for the periods legally required to address any potential liabilities (generally, invoicing data is kept for the periods provided for under commercial and tax law). Enquiry data is kept for the time necessary to handle it and, where appropriate, to manage any follow-up.",
      ],
    },
    {
      heading: "5. Recipients of the data",
      body: [
        "In order to provide our services, some suppliers process data on behalf of the controller, as data processors and with the appropriate contractual safeguards:",
        "Stripe: payment processing.\nGoogle (Google Analytics): web analytics, provided you have consented to cookies.\nWebsite hosting provider.\nEmail service provider.",
        "Some of these providers may be located outside the European Economic Area. In such cases, international data transfers are carried out with the appropriate safeguards provided for under the GDPR (for example, standard contractual clauses approved by the European Commission or applicable adequacy frameworks). We do not share your data with third parties for purposes other than those described, except where legally required.",
      ],
    },
    {
      heading: "6. Your rights",
      body: [
        "You may exercise your rights of access, rectification, erasure, objection, restriction of processing and data portability at any time, as well as withdraw any consent given, by writing to office@nostrumoils.com and stating the right you wish to exercise. We may ask you to prove your identity.",
        "If you believe that the processing of your data does not comply with the regulations, you have the right to lodge a complaint with the Spanish Data Protection Agency (www.aepd.es).",
      ],
    },
    {
      heading: "7. Security",
      body: [
        "We apply appropriate technical and organisational measures to ensure a level of security appropriate to the risk and to protect your data against loss, misuse or unauthorised access.",
      ],
    },
    {
      heading: "8. Minors",
      body: [
        "The website and the shop are not aimed at minors. By registering or purchasing, you declare that you are of legal age and have the capacity to enter into a contract.",
      ],
    },
    {
      heading: "9. Cookies",
      body: ["The website uses first-party and third-party cookies. You can find the details in our Cookie Policy."],
    },
    {
      heading: "10. Changes to this policy",
      body: [
        "We may update this Privacy Policy to adapt it to regulatory changes or to our services. The version in force will always be the one published on the website.",
        "Last updated: 20 August 2026",
      ],
    },
  ],
};

const en_cookies: LegalDoc = {
  title: "Cookie Policy",
  sections: [
    {
      heading: "1. What are cookies?",
      body: [
        "A cookie is a small text file that a website stores in your browser when you visit it. It is used, for example, to remember your preferences, keep you logged in or understand, on a statistical basis, how the site is used. This policy explains which cookies nostrumoils.com uses and how you can manage them.",
      ],
    },
    {
      heading: "2. Who uses the cookies?",
      body: [
        "The party responsible for the use of cookies is Oli Gerpifi, S.L., Tax ID (NIF) B43445766, with registered office at Polígono Pla de Solans, 22/23, 43519 El Perelló (Tarragona) and contact email office@nostrumoils.com.",
      ],
    },
    {
      heading: "3. Types of cookies we use",
      body: [
        "a) Technical or necessary cookies. These are essential for the website to work and do not require your consent. They allow, among other things, logging in to your customer account, keeping products in the cart, processing payment securely and remembering your choice about cookies. This group includes the cookies of the Stripe payment gateway, which are used to process payments and prevent fraud.",
        "b) Analytics cookies. These allow us to understand, on a statistical and aggregated basis, how users interact with the website (pages visited, time spent, etc.) in order to improve it. We use Google Analytics. These cookies are only installed if you give your consent.",
        "This website does not use advertising cookies or cookies for tracking for advertising purposes.",
      ],
    },
    {
      heading: "4. Cookie details",
      body: [],
      table: {
        headers: ["Cookie", "Owner", "Type", "Purpose", "Duration"],
        rows: [
          ["Session / login", "Oli Gerpifi, S.L.", "Technical", "Maintain the session and access to the customer account", "Session"],
          ["Cart", "Oli Gerpifi, S.L.", "Technical", "Remember the products added to the cart", "Session"],
          ["Cookie consent", "Oli Gerpifi, S.L.", "Technical", "Remember your choice about cookies", "6 months"],
          ["__stripe_mid", "Stripe", "Technical", "Process payment and prevent fraud", "1 year"],
          ["__stripe_sid", "Stripe", "Technical", "Process payment and prevent fraud", "30 minutes"],
          ["_ga", "Google Analytics", "Analytics", "Distinguish users on a statistical basis", "2 years"],
          ["_ga_*", "Google Analytics", "Analytics", "Maintain the analytics session state", "2 years"],
        ],
      },
    },
    {
      heading: "5. Consent",
      body: [
        "When you access the website for the first time, a cookie banner appears that lets you accept all, reject all (except technical cookies, which are essential) or configure your preferences. Analytics cookies are not activated until you give your consent.",
        "You can change or withdraw your consent at any time through the cookie settings link available on the website.",
      ],
    },
    {
      heading: "6. How to manage or delete cookies from your browser",
      body: [
        "In addition to the website's settings panel, you can allow, block or delete the cookies installed on your device from your browser settings (Google Chrome, Mozilla Firefox, Safari or Microsoft Edge). Please note that if you disable technical cookies, some website features (such as logging in or purchasing) may not work correctly.",
      ],
    },
    {
      heading: "7. Changes to this policy",
      body: [
        "We may update this Cookie Policy as the cookies we use or the applicable regulations change. The version in force will always be the one published on the website.",
        "Last updated: 20 August 2026",
      ],
    },
  ],
};

const en_terms: LegalDoc = {
  title: "General Terms of Sale",
  sections: [
    {
      heading: "1. Preliminary information",
      body: [
        "These terms govern the sale of products through the website nostrumoils.com. The seller is:",
        "Seller: Oli Gerpifi, S.L.\nTax ID (NIF): B43445766\nAddress: Polígono Pla de Solans, 22/23, 43519 El Perelló (Tarragona), Spain\nEmail: sales@nostrumoils.com\nPhone: +34 680 889 399",
        "By placing an order, the customer declares that they are of legal age and accept these terms. We recommend reading and saving them before purchasing.",
      ],
    },
    {
      heading: "2. Products",
      body: [
        "The seller sells extra virgin olive oil. The characteristics of each product are described on its product page within the website. Images are for guidance only and may show slight differences from the actual product.",
      ],
    },
    {
      heading: "3. Prices",
      body: [
        "Product prices are those shown on each product page at the time the order is placed and include applicable VAT. Shipping costs, where applicable, are shown separately and displayed before the order is confirmed. The seller reserves the right to change prices at any time, with the price in force at the time of purchase always applying.",
      ],
    },
    {
      heading: "4. Purchase process",
      body: [
        "The customer selects the products, adds them to the cart and follows the steps indicated to complete the purchase, providing shipping and payment details. Before confirming, the customer can review the order and correct any errors. Once the order is confirmed and paid, the customer will receive a confirmation email. The contract is formalised in the language in which the purchase process is displayed.",
      ],
    },
    {
      heading: "5. Payment methods",
      body: [
        "Payment is made through the secure Stripe payment gateway, which accepts credit or debit cards and, depending on the device, systems such as Apple Pay or Google Pay. The seller has no access to and does not store the customer's full card details.",
      ],
    },
    {
      heading: "6. Shipping",
      body: [
        "We ship to Spain and to the other countries of the European Union. The shipping cost and the estimated delivery time are shown during the purchase process, before the customer confirms the order. Delivery times are estimates and may vary for reasons beyond the seller's control (for example, carrier incidents).",
      ],
    },
    {
      heading: "7. Right of withdrawal",
      body: [
        "A customer acting as a consumer has a period of 14 calendar days from receipt of the order to withdraw from the purchase without giving any reason.",
        "As this is a food product, and for reasons of hygiene and safety, only the withdrawal of bottles returned unopened and with their original seal intact is accepted. In accordance with Article 103 of the consolidated text of the Spanish General Law for the Protection of Consumers and Users, withdrawal is not accepted for products that have been opened or whose seal has been broken after delivery.",
        "To exercise the right of withdrawal, the customer must notify us within the deadline at sales@nostrumoils.com, stating their order. The product must then be returned, unopened and sealed, to the address: Polígono Pla de Solans, 22/23, 43519 El Perelló (Tarragona), Spain.",
        "The direct cost of returning the product is borne by the customer.",
      ],
    },
    {
      heading: "8. Returns and refunds",
      body: [
        "Once the returned product has been received and checked to meet the above conditions (unopened and sealed), the seller will refund the amount paid, including the initial shipping costs where applicable, within a maximum of 14 calendar days from becoming aware of the withdrawal, using the same means of payment used for the purchase.",
        "If the product arrives defective, damaged or does not match the order, the customer must notify sales@nostrumoils.com as soon as possible; in such cases, the seller will bear the costs of replacement or return.",
      ],
    },
    {
      heading: "9. Warranty",
      body: [
        "The products carry the legal guarantee of conformity provided for under consumer protection law. The customer must keep the products under appropriate temperature and storage conditions and observe the best-before date shown on the packaging.",
      ],
    },
    {
      heading: "10. Customer service and complaints",
      body: [
        "For any query or complaint, the customer may contact sales@nostrumoils.com. As a consumer, they have the right to turn to the competent consumer bodies and consumer arbitration boards for the resolution of disputes.",
      ],
    },
    {
      heading: "11. Applicable law",
      body: [
        "These terms are governed by Spanish law. In relations with consumers, the rights granted to them by applicable law and the jurisdiction of the corresponding courts under that law will be respected in all cases.",
        "Last updated: 20 August 2026",
      ],
    },
  ],
};

// ── Spanish (ES) ─────────────────────────────────────────────────────────────

const es_legal: LegalDoc = {
  title: "Aviso Legal",
  sections: [
    {
      heading: "1. Datos identificativos",
      body: [
        "En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico, se facilitan los datos del titular de este sitio web:",
        "Titular: Oli Gerpifi, S.L.\nNIF: B43445766\nDomicilio social: Polígono Pla de Solans, 22/23, 43519 El Perelló (Tarragona), España\nCorreo electrónico: office@nostrumoils.com\nTeléfono: +34 680 889 399\nSitio web: https://nostrumoils.com",
      ],
    },
    {
      heading: "2. Objeto",
      body: [
        "Este Aviso Legal regula el acceso, la navegación y el uso del sitio web nostrumoils.com, a través del cual el titular comercializa aceite de oliva virgen extra y ofrece contenidos informativos sobre sus productos y su actividad.",
        "El acceso al sitio web es gratuito y atribuye a quien lo utiliza la condición de usuario. La navegación por el sitio web implica la aceptación de las condiciones recogidas en este Aviso Legal. Si el usuario no está de acuerdo con ellas, deberá abstenerse de utilizar el sitio web.",
      ],
    },
    {
      heading: "3. Condiciones de uso",
      body: [
        "El usuario se compromete a hacer un uso adecuado y lícito del sitio web y de sus contenidos, conforme a la legislación aplicable, a este Aviso Legal y a las buenas costumbres. En particular, se compromete a no utilizar el sitio web con fines ilícitos o lesivos, ni a realizar ninguna acción que pueda dañarlo, inutilizarlo, sobrecargarlo o impedir su normal funcionamiento.",
        "El titular podrá modificar en cualquier momento y sin previo aviso el diseño, la presentación y la configuración del sitio web, así como sus contenidos y las condiciones de acceso.",
      ],
    },
    {
      heading: "4. Propiedad intelectual e industrial",
      body: [
        "Todos los contenidos del sitio web (textos, fotografías, gráficos, imágenes, diseño, logotipos, nombres comerciales, marcas y código fuente) son titularidad del titular o de terceros que han autorizado su uso, y están protegidos por la normativa de propiedad intelectual e industrial.",
        "Queda prohibida la reproducción, distribución, comunicación pública, transformación o cualquier otra forma de explotación, total o parcial, de los contenidos del sitio web sin la autorización previa y por escrito del titular. El acceso al sitio web no otorga al usuario ningún derecho de titularidad sobre los contenidos.",
      ],
    },
    {
      heading: "5. Responsabilidad",
      body: [
        "El titular trabaja para garantizar la disponibilidad y el correcto funcionamiento del sitio web, pero no puede garantizar la ausencia de interrupciones o errores en el acceso, ni que los contenidos estén siempre actualizados. En la medida permitida por la ley, el titular no se responsabiliza de los daños o perjuicios que pudieran derivarse de la falta de disponibilidad o continuidad del sitio web.",
        "El sitio web puede contener enlaces a sitios de terceros. El titular no asume ninguna responsabilidad sobre los contenidos, servicios o políticas de dichos sitios, cuyo acceso corresponde a la exclusiva decisión y responsabilidad del usuario.",
      ],
    },
    {
      heading: "6. Protección de datos",
      body: [
        "El tratamiento de los datos personales de los usuarios se rige por la Política de Privacidad de este sitio web, que forma parte de este Aviso Legal y que el usuario debe leer con atención.",
      ],
    },
    {
      heading: "7. Legislación aplicable y jurisdicción",
      body: [
        "Este Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia derivada del acceso o uso del sitio web, las partes se someten a los juzgados y tribunales que resulten competentes conforme a la normativa aplicable, respetando en todo caso los derechos que la legislación de consumo reconoce a los consumidores y usuarios.",
        "Última actualización: 20 de agosto de 2026",
      ],
    },
  ],
};

const es_privacy: LegalDoc = {
  title: "Política de Privacidad",
  sections: [
    {
      heading: "",
      body: [
        "En Oli Gerpifi, S.L. nos tomamos en serio la privacidad de nuestros usuarios y clientes. Esta Política de Privacidad explica qué datos personales tratamos, con qué finalidad, sobre qué base legal y qué derechos te asisten, de conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).",
      ],
    },
    {
      heading: "1. Responsable del tratamiento",
      body: [
        "Responsable: Oli Gerpifi, S.L.\nNIF: B43445766\nDomicilio: Polígono Pla de Solans, 22/23, 43519 El Perelló (Tarragona), España\nCorreo electrónico: office@nostrumoils.com\nTeléfono: +34 680 889 399",
      ],
    },
    {
      heading: "2. Datos que tratamos y finalidades",
      body: [
        "Tratamos los datos personales que nos facilitas a través del sitio web, según el uso que hagas de él:",
        "a) Cuenta de cliente. Cuando te registras, tratamos tu nombre, apellidos, correo electrónico y contraseña con la finalidad de crear y gestionar tu cuenta y permitirte acceder a tu área privada, tu historial de pedidos y tus datos.",
        "b) Pedidos y pagos. Cuando realizas una compra, tratamos tus datos identificativos, de contacto, dirección de envío y facturación, y los datos necesarios para tramitar el pedido. El pago se procesa a través de la pasarela de pago Stripe; el responsable no almacena en ningún momento los datos completos de tu tarjeta.",
        "c) Formulario de contacto y consultas. Cuando nos escribes a través del formulario de contacto o por correo electrónico, tratamos los datos que nos facilites (nombre, correo y el contenido de tu mensaje) con la finalidad de atender y responder tu consulta.",
        "d) Analítica web. Utilizamos Google Analytics para conocer de forma estadística cómo se usa el sitio web y mejorarlo. Estos datos solo se tratan si prestas tu consentimiento a través del banner de cookies. Puedes consultar el detalle en nuestra Política de Cookies.",
      ],
    },
    {
      heading: "3. Base jurídica del tratamiento",
      body: [
        "Cuenta de cliente y gestión de pedidos y pagos: ejecución de un contrato en el que eres parte (art. 6.1.b RGPD).",
        "Facturación y obligaciones contables y fiscales: cumplimiento de obligaciones legales (art. 6.1.c RGPD).",
        "Atención de consultas: tu consentimiento o el interés legítimo en atenderte (art. 6.1.a y 6.1.f RGPD).",
        "Analítica web mediante cookies: tu consentimiento (art. 6.1.a RGPD).",
      ],
    },
    {
      heading: "4. Plazos de conservación",
      body: [
        "Conservamos tus datos mientras se mantenga la relación con el responsable (por ejemplo, mientras tengas cuenta de cliente) y, una vez finalizada, durante los plazos legalmente exigidos para atender posibles responsabilidades (con carácter general, los datos de facturación se conservan durante los plazos previstos en la normativa mercantil y fiscal). Los datos de consultas se conservan el tiempo necesario para atenderlas y, en su caso, gestionar su seguimiento.",
      ],
    },
    {
      heading: "5. Destinatarios de los datos",
      body: [
        "Para poder prestarte nuestros servicios, algunos proveedores tratan datos por cuenta del responsable, como encargados del tratamiento y con las debidas garantías contractuales:",
        "Stripe: procesamiento de pagos.\nGoogle (Google Analytics): analítica web, siempre que hayas consentido las cookies.\nProveedor de alojamiento (hosting) del sitio web.\nProveedor de servicios de correo electrónico.",
        "Algunos de estos proveedores pueden estar ubicados fuera del Espacio Económico Europeo. En tal caso, las transferencias internacionales de datos se realizan con las garantías adecuadas previstas en el RGPD (por ejemplo, cláusulas contractuales tipo aprobadas por la Comisión Europea o marcos de adecuación aplicables). No cedemos tus datos a terceros para finalidades distintas de las descritas, salvo obligación legal.",
      ],
    },
    {
      heading: "6. Tus derechos",
      body: [
        "Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de tus datos, así como retirar el consentimiento prestado, escribiendo a office@nostrumoils.com e indicando el derecho que deseas ejercer. Podemos solicitarte que acredites tu identidad.",
        "Si consideras que el tratamiento de tus datos no se ajusta a la normativa, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).",
      ],
    },
    {
      heading: "7. Seguridad",
      body: [
        "Aplicamos las medidas técnicas y organizativas apropiadas para garantizar un nivel de seguridad adecuado al riesgo y proteger tus datos frente a su pérdida, uso indebido o acceso no autorizado.",
      ],
    },
    {
      heading: "8. Menores de edad",
      body: [
        "El sitio web y la tienda no están dirigidos a menores de edad. Al registrarte o comprar, declaras ser mayor de edad y tener capacidad para contratar.",
      ],
    },
    {
      heading: "9. Cookies",
      body: ["El sitio web utiliza cookies propias y de terceros. Puedes consultar el detalle en nuestra Política de Cookies."],
    },
    {
      heading: "10. Cambios en esta política",
      body: [
        "Podemos actualizar esta Política de Privacidad para adaptarla a cambios normativos o a nuestros servicios. La versión vigente será siempre la publicada en el sitio web.",
        "Última actualización: 20 de agosto de 2026",
      ],
    },
  ],
};

const es_cookies: LegalDoc = {
  title: "Política de Cookies",
  sections: [
    {
      heading: "1. ¿Qué son las cookies?",
      body: [
        "Una cookie es un pequeño archivo de texto que un sitio web guarda en tu navegador cuando lo visitas. Sirve, por ejemplo, para recordar tus preferencias, mantener tu sesión iniciada o entender de forma estadística cómo se usa el sitio. Esta política explica qué cookies utiliza nostrumoils.com y cómo puedes gestionarlas.",
      ],
    },
    {
      heading: "2. ¿Quién utiliza las cookies?",
      body: [
        "El responsable del uso de las cookies es Oli Gerpifi, S.L., NIF B43445766, con domicilio en Polígono Pla de Solans, 22/23, 43519 El Perelló (Tarragona) y correo de contacto office@nostrumoils.com.",
      ],
    },
    {
      heading: "3. Tipos de cookies que utilizamos",
      body: [
        "a) Cookies técnicas o necesarias. Son imprescindibles para que el sitio web funcione y no requieren tu consentimiento. Permiten, entre otras cosas, iniciar sesión en tu cuenta de cliente, mantener los productos en el carrito, procesar el pago de forma segura y recordar tu elección sobre las cookies. Dentro de este grupo se incluyen las cookies de la pasarela de pago Stripe, que se utilizan para procesar los pagos y prevenir el fraude.",
        "b) Cookies analíticas. Nos permiten conocer de forma estadística y agregada cómo interactúan los usuarios con el sitio web (páginas visitadas, tiempo de permanencia, etc.) para mejorarlo. Utilizamos Google Analytics. Estas cookies solo se instalan si prestas tu consentimiento.",
        "Este sitio web no utiliza cookies de publicidad ni de seguimiento con fines publicitarios.",
      ],
    },
    {
      heading: "4. Detalle de las cookies",
      body: [],
      table: {
        headers: ["Cookie", "Titular", "Tipo", "Finalidad", "Duración"],
        rows: [
          ["Sesión / inicio de sesión", "Oli Gerpifi, S.L.", "Técnica", "Mantener la sesión y el acceso a la cuenta de cliente", "Sesión"],
          ["Carrito", "Oli Gerpifi, S.L.", "Técnica", "Recordar los productos añadidos al carrito", "Sesión"],
          ["Consentimiento de cookies", "Oli Gerpifi, S.L.", "Técnica", "Recordar tu elección sobre las cookies", "6 meses"],
          ["__stripe_mid", "Stripe", "Técnica", "Procesar el pago y prevenir el fraude", "1 año"],
          ["__stripe_sid", "Stripe", "Técnica", "Procesar el pago y prevenir el fraude", "30 minutos"],
          ["_ga", "Google Analytics", "Analítica", "Distinguir usuarios de forma estadística", "2 años"],
          ["_ga_*", "Google Analytics", "Analítica", "Mantener el estado de la sesión de analítica", "2 años"],
        ],
      },
    },
    {
      heading: "5. Consentimiento",
      body: [
        "Cuando accedes por primera vez al sitio web, aparece un banner de cookies que te permite aceptar todas, rechazar todas (salvo las técnicas, que son imprescindibles) o configurar tus preferencias. Las cookies analíticas no se activan hasta que prestas tu consentimiento.",
        "Puedes cambiar o retirar tu consentimiento en cualquier momento desde el enlace de configuración de cookies disponible en el sitio web.",
      ],
    },
    {
      heading: "6. Cómo gestionar o eliminar las cookies desde tu navegador",
      body: [
        "Además del panel de configuración del sitio web, puedes permitir, bloquear o eliminar las cookies instaladas en tu equipo desde la configuración de tu navegador (Google Chrome, Mozilla Firefox, Safari o Microsoft Edge). Ten en cuenta que, si desactivas las cookies técnicas, algunas funciones del sitio web (como iniciar sesión o comprar) podrían no funcionar correctamente.",
      ],
    },
    {
      heading: "7. Cambios en esta política",
      body: [
        "Podemos actualizar esta Política de Cookies según cambien las cookies que utilizamos o la normativa aplicable. La versión vigente será siempre la publicada en el sitio web.",
        "Última actualización: 20 de agosto de 2026",
      ],
    },
  ],
};

const es_terms: LegalDoc = {
  title: "Condiciones Generales de Venta",
  sections: [
    {
      heading: "1. Información previa",
      body: [
        "Las presentes condiciones regulan la venta de productos a través del sitio web nostrumoils.com. El vendedor es:",
        "Vendedor: Oli Gerpifi, S.L.\nNIF: B43445766\nDomicilio: Polígono Pla de Solans, 22/23, 43519 El Perelló (Tarragona), España\nCorreo electrónico: sales@nostrumoils.com\nTeléfono: +34 680 889 399",
        "Al realizar un pedido, el cliente declara ser mayor de edad y aceptar estas condiciones. Se recomienda leerlas y guardarlas antes de comprar.",
      ],
    },
    {
      heading: "2. Productos",
      body: [
        "El vendedor comercializa aceite de oliva virgen extra. Las características de cada producto se describen en su ficha dentro del sitio web. Las imágenes tienen carácter orientativo y pueden presentar pequeñas diferencias respecto al producto real.",
      ],
    },
    {
      heading: "3. Precios",
      body: [
        "Los precios de los productos son los que figuran en cada ficha de producto en el momento de realizar el pedido e incluyen el IVA aplicable. Los gastos de envío, cuando correspondan, se indican de forma separada y se muestran antes de confirmar el pedido. El vendedor se reserva el derecho de modificar los precios en cualquier momento, aplicándose siempre el precio vigente en el momento de la compra.",
      ],
    },
    {
      heading: "4. Proceso de compra",
      body: [
        "El cliente selecciona los productos, los añade al carrito y sigue los pasos indicados para finalizar la compra, facilitando los datos de envío y de pago. Antes de confirmar, podrá revisar el pedido y corregir posibles errores. Una vez confirmado y pagado el pedido, el cliente recibirá un correo de confirmación. El contrato se formaliza en el idioma en que se muestre el proceso de compra.",
      ],
    },
    {
      heading: "5. Formas de pago",
      body: [
        "El pago se realiza a través de la pasarela de pago segura Stripe, que admite tarjeta de crédito o débito y, según el dispositivo, sistemas como Apple Pay o Google Pay. El vendedor no tiene acceso ni almacena los datos completos de la tarjeta del cliente.",
      ],
    },
    {
      heading: "6. Envíos",
      body: [
        "Se realizan envíos a España y al resto de países de la Unión Europea. El coste del envío y el plazo estimado de entrega se muestran durante el proceso de compra, antes de que el cliente confirme el pedido. Los plazos de entrega son estimativos y pueden variar por causas ajenas al vendedor (por ejemplo, incidencias del transportista).",
      ],
    },
    {
      heading: "7. Derecho de desistimiento",
      body: [
        "El cliente que actúe como consumidor dispone de un plazo de 14 días naturales, desde la recepción del pedido, para desistir de la compra sin necesidad de justificación.",
        "Por tratarse de un producto alimentario, y por razones de higiene y seguridad, solo se admite el desistimiento de botellas que se devuelvan cerradas y con su precinto original intacto. De acuerdo con el artículo 103 del texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios, no se admite el desistimiento de productos que hayan sido abiertos o cuyo precinto se haya roto tras la entrega.",
        "Para ejercer el desistimiento, el cliente deberá comunicarlo dentro del plazo a sales@nostrumoils.com, indicando su pedido. A continuación deberá devolver el producto, cerrado y precintado, a la dirección: Polígono Pla de Solans, 22/23, 43519 El Perelló (Tarragona), España.",
        "El coste directo de la devolución del producto corre a cargo del cliente.",
      ],
    },
    {
      heading: "8. Devoluciones y reembolsos",
      body: [
        "Una vez recibido el producto devuelto y comprobado que cumple las condiciones anteriores (cerrado y precintado), el vendedor reembolsará el importe abonado, incluidos los gastos de envío iniciales cuando proceda, en un plazo máximo de 14 días naturales desde que tenga constancia del desistimiento, utilizando el mismo medio de pago empleado en la compra.",
        "Si el producto llega defectuoso, dañado o no se corresponde con el pedido, el cliente deberá comunicarlo a sales@nostrumoils.com lo antes posible; en estos casos, el vendedor asumirá los costes de sustitución o devolución.",
      ],
    },
    {
      heading: "9. Garantía",
      body: [
        "Los productos cuentan con la garantía legal de conformidad prevista en la normativa de consumo. El cliente debe conservar los productos en las condiciones de temperatura y almacenamiento adecuadas y respetar la fecha de consumo preferente indicada en el envase.",
      ],
    },
    {
      heading: "10. Atención al cliente y reclamaciones",
      body: [
        "Para cualquier consulta o reclamación, el cliente puede dirigirse a sales@nostrumoils.com. Como consumidor, tiene derecho a acudir a los organismos de consumo competentes y a las juntas arbitrales de consumo para la resolución de conflictos.",
      ],
    },
    {
      heading: "11. Legislación aplicable",
      body: [
        "Estas condiciones se rigen por la legislación española. En las relaciones con consumidores, se respetarán en todo caso los derechos que les reconoce la normativa aplicable y la competencia de los tribunales que correspondan conforme a dicha normativa.",
        "Última actualización: 20 de agosto de 2026",
      ],
    },
  ],
};

// ── Export mapping ───────────────────────────────────────────────────────────

export const legalDocs: Record<LegalLocale, Record<string, LegalDoc>> = {
  en: {
    legal: en_legal,
    privacy: en_privacy,
    cookies: en_cookies,
    terms: en_terms,
  },
  es: {
    legal: es_legal,
    privacy: es_privacy,
    cookies: es_cookies,
    terms: es_terms,
  },
  ca: {
    legal: en_legal, // Using EN fallback - Catalan content ready to add
    privacy: en_privacy,
    cookies: en_cookies,
    terms: en_terms,
  },
  it: {
    legal: en_legal, // Using EN fallback - Italian content ready to add
    privacy: en_privacy,
    cookies: en_cookies,
    terms: en_terms,
  },
  el: {
    legal: en_legal, // Using EN fallback - Greek content ready to add
    privacy: en_privacy,
    cookies: en_cookies,
    terms: en_terms,
  },
};
