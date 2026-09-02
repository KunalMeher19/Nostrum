# Nostrum - Translation Fixes

## Scope

This document converts the full **Nostrum. Translation fixes** review into an implementation-ready Markdown checklist.

Languages covered:
- Spanish (ES)
- Catalan (CA)
- Italian (IT)
- Greek (EL)

For every copy change below:
- **Key** = translation/content key when one is provided by the review.
- **Current** = text currently on the site.
- **Change to** = exact replacement requested by the review.
- Where the review describes a functional/content requirement rather than a simple string replacement, it is recorded under **Requirement**.

---

# 1. Spanish (ES)

## 1.1 Every page - Header, footer, cookie banner

| Where | Key | Current | Change to |
|---|---|---|---|
| Cookie banner, whole banner | - | Cookies / Usamos cookies para mejorar tu experiencia de navegación y para entender mejor cómo se usa Nostrum. Elige "Aceptar" para la analítica completa o "Rechazar" para la analítica básica y no sensible. / Aceptar / Preferencias / Rechazar | Cookies / Usamos cookies para mejorar tu experiencia de navegación y para entender mejor cómo se usa Nostrum. Elige "Aceptar" para la analítica completa o "Rechazar" para la analítica básica y no sensible. / Aceptar / Preferencias / Rechazar |
| Footer address block + same block on Contact | - | El Perelló, Catalonia / Spain, EU | El Perelló, Cataluña / España, UE |
| Footer bottom line next to year | `footer.origin` | Origen Cataluña, España | Origen: Cataluña, España |
| Footer navigation link to Origins | `footer.history` | Historia | Nuestra Historia |
| Full-screen menu cart entry | `curtain.cart` | Carrito | Cesta |
| Screen-reader label, header | - | Nostrum home | Inicio de Nostrum |
| Screen-reader label | - | open menu | abrir menú |
| Screen-reader label | - | Shopping cart | Cesta de la compra |
| Screen-reader label | - | Account | Cuenta |
| Screen-reader label | - | Main navigation | Navegación principal |
| Screen-reader label | - | Site footer | Pie de página |
| Screen-reader label | - | Footer navigation | Navegación del pie |
| Screen-reader label | - | Our story | Nuestra historia |
| Screen-reader label | - | Shop the collection | Comprar la colección |

## 1.2 Browser tab titles and Google descriptions

| Where | Key | Current | Change to |
|---|---|---|---|
| Checkout browser tab title | `meta.checkout_title` | Pago · Nostrum | Pago · Nostrum |
| Cart browser tab title | `meta.cart_title` | Carrito · Nostrum | Cesta · Nostrum |
| Home page Google description | `meta.home_description` | Nostrum no es simplemente aceite de oliva. Una experiencia de marca de lujo, la historia primero, el producto después. | Nostrum no es simplemente aceite de oliva. Una experiencia de marca de lujo: primero la historia, después el producto. |
| Unsubscribe page Google description | `meta.unsubscribe_description` | Deja el Diario Nostrum. | Date de baja del Diario Nostrum. |

## 1.3 Home page

| Where | Key | Current | Change to |
|---|---|---|---|
| Hero, word under first slide / scroll prompt | `hero.scroll` | Desliza | Desplázate |
| Hero, second slide headline | `hero.slide1_h1` | Oro líquido, vertido | Oro líquido, servido |
| Hero, button next to "Ver nuestra historia" | `hero.explore_products` | Explorar productos | Explora los productos |
| Collection section button under product cards | `shop.cta` | Explorar más productos | Explora más productos |
| Product card button | `shop.add` | Añadir al carrito | Añadir a la cesta |
| Story quote, second line | `story.quote2` | prensado en horas | prensado en pocas horas |
| Hero image alt text 1 | - | Close-up of glistening drop of olive oil on the rounded edge of a matte black pouring spout, lit with warm amber light. | Primer plano de una gota de aceite de oliva en el borde redondeado de un vertedor negro mate, con luz ámbar cálida. |
| Hero image alt text 2 | - | Close-up of the glossy surface of extra virgin olive oil, its golden-green ripples catching soft amber light. | Primer plano de la superficie brillante del aceite de oliva virgen extra, con ondas doradas y verdes bajo una luz ámbar suave. |
| Hero image alt text 3 | - | A dark amber glass Nostrum bottle catching a single streak of warm gold light against black. | Botella Nostrum de vidrio ámbar oscuro recorrida por un destello de luz dorada sobre fondo negro. |
| Hero image alt text 4 | - | Ripe olives on the branch in the Nostrum grove | Aceitunas maduras en la rama del olivar de Nostrum |

## 1.4 Origins page

| Where | Key | Current | Change to |
|---|---|---|---|
| "El lugar" map sea name | `map.sea` | Mar Mediterrània | Mar Mediterráneo |
| "La tierra" scene caption | `scenes.s0_c1` | dos siglos de edad | dos siglos de historia |
| "La familia" scene caption | `scenes.s1_c2` | el siguiente par | el siguiente par de manos |
| "La cosecha" scene caption | `scenes.s2_c2` | a horas de la prensa | a pocas horas de la almazara |
| "Cómo se elabora", step 2 | `process.step2_copy` | Fuera hojas y tallos, solo queda fruto limpio. | Fuera hojas y ramitas, solo queda fruto limpio. |
| "Cómo se elabora", step 3 | `process.step3_copy` | Molido a la piedra hasta una pasta, amasado lentamente para liberar el aceite. | Molido a la piedra hasta formar una pasta, batido lentamente para liberar el aceite. |
| "Cómo se elabora", step 4 | `process.step4_copy` | Separado por debajo de 27°C, para que nada del fruto se pierda. | Separado por debajo de 27 °C, para que nada del fruto se pierda. |
| "Cómo se elabora", step 5 | `process.step5_copy` | Sellado recién salido del molino, solo primera prensada en frío. | Sellado recién salido de la almazara, solo primera prensada en frío. |
| Image alt text 1 | - | Ancient olive tree above the Mediterranean coast at golden hour | Olivo centenario sobre la costa mediterránea a la hora dorada |
| Image alt text 2 | - | Weathered hands passing fresh olives to a younger hand | Unas manos curtidas pasan aceitunas recién cogidas a unas manos jóvenes |
| Image alt text 3 | - | Olives pouring from a wooden harvest crate at sunrise | Aceitunas cayendo de una caja de madera al amanecer |
| Image alt text 4 | - | Olive leaves and fruit / Olive oil surface / Oil drawn from the press / Bottle shoulder reflection | Hojas y fruto del olivo / Superficie del aceite de oliva / Aceite recién salido de la prensa / Reflejo en el hombro de la botella |

## 1.5 Shop and product page

| Where | Key | Current | Change to |
|---|---|---|---|
| Product page main buy button | `product.add_to_cart` | Añadir al carrito | Añadir a la cesta |
| Product page button after click | `product.added_to_cart` | Añadido al carrito | Añadido a la cesta |
| Label above 2L / 5L selector | `product.size` | Tamaño | Formato |
| Label shown for "Personalizado" | `product.amount` | Cantidad | Unidades |
| Description tab, first line | `product.desc_1` | Elaborado con aceitunas de cosecha temprana, extraído en frío en horas para conservar el máximo sabor, aroma y nutrientes. | Elaborado con aceitunas de cosecha temprana, extraído en frío en pocas horas para conservar el máximo sabor, aroma y nutrientes. |
| Description tab, second line | `product.desc_2` | Suave, equilibrado y verde. Para cocinar a diario, aliños y acabados. | Suave, equilibrado y verde. Para cocinar a diario, para aliñar y para terminar los platos. |
| Shipping tab, second line | `product.shipping_2` | Embotellado bajo pedido y embalado en packaging protector y reciclable. | Embotellado bajo pedido y embalado en un envase protector y reciclable. |
| Third badge under buy button | `product.returns` | Devolución 14 días | Devoluciones en 14 días |
| Details tab, acidity value | `product.detail_acidity_value` | ≤ 0,3% | ≤ 0,3 % |
| Screen-reader labels | - | Breadcrumb / Product image / Product details / More information | Ruta de navegación / Imagen del producto / Detalles del producto / Más información |

## 1.6 Journal

### Article translations and routing requirement

The three article titles, the three summaries, and the full article text currently appear in English inside the Spanish site. The article URL is also in English, e.g. `/es/journal/why-we-still-pick-by-hand`.

**Requirement:**
1. Add a Spanish title for each article in the admin panel.
2. Add a Spanish summary for each article in the admin panel.
3. Add the full Spanish article text for each article in the admin panel.
4. Add a Spanish web address/slug for each article in the admin panel.
5. Until an article has its Spanish version, it must **not appear** on the Spanish Journal.

### Journal copy changes

| Where | Key | Current | Change to |
|---|---|---|---|
| Museum first-room caption | `journal.room_grove_sub` | Árboles viejos, suelo fino, paciencia medida en décadas. | Olivos viejos, suelo pobre, paciencia medida en décadas. |
| Museum third-room name | `journal.room_mill` | El molino | La almazara |
| Museum third-room caption | `journal.room_mill_sub` | De la rama a la prensa en horas, nunca en días. | De la rama a la almazara en horas, nunca en días. |
| Museum intro paragraph | `journal.museum_lede` | Cuatro salas. El olivar, la cosecha, el molino, la familia. Imágenes del lugar real, con unas palabras junto a cada una. | Cuatro salas. El olivar, la cosecha, la almazara, la familia. Imágenes del lugar real, con unas palabras junto a cada una. |
| Journal page top scroll prompt | `journal.scroll_hint` | Recorrer | Recorre el museo |
| Link under each article | `journal.read_story` | Leer | Leer la historia |
| Bottom-of-article shop button | `journal.to_shop` | Llevar el aceite a casa | Llévate el aceite a casa |

## 1.7 Contact page

| Where | Key | Current | Change to |
|---|---|---|---|
| Paragraph under "Hablemos." | `contact.lede` | Un pedido, una pregunta, una cocina profesional, escríbenos. Respondemos personalmente. | ¿Un pedido, una pregunta, una cocina profesional? Escríbenos. Respondemos personalmente. |
| Contact form email field | `contact.field_email` | Tu email | Tu correo electrónico |

## 1.8 Cart and checkout

| Where | Key | Current | Change to |
|---|---|---|---|
| Checkout link back to cart | `checkout.back_to_cart` | Volver al carrito | Volver a la cesta |
| Required-field validation warning | `checkout.validation_error` | Por favor complete todos los campos obligatorios | Por favor, completa todos los campos obligatorios. |
| Address form line 1 | `checkout.address_line1` | Dirección línea 1 | Dirección |
| Address form line 2 | `checkout.address_line2` | Dirección línea 2 (opcional) | Dirección, segunda línea (opcional) |
| Second guarantee box | `checkout.trust_quality_note` | Aceite de oliva virgen extra auténtico | 100% aceite de oliva virgen extra auténtico |
| Fourth guarantee box | `checkout.trust_returns_note` | Devoluciones dentro de 14 días | Devoluciones en un plazo de 14 días |
| Payment-cancelled page message | `checkout_cancel.message` | Tu pago no se ha procesado. Tu cesta se ha guardado y puedes volver a tramitarla cuando estés listo. | Tu pago no se ha procesado. Tu cesta se ha guardado y puedes volver a tramitarla cuando quieras. |

## 1.9 Account and customer area

| Where | Key | Current | Change to |
|---|---|---|---|
| Account first tab | `account.tab_signin` | Entrar | Iniciar sesión |
| Sign-in form main button | `account.submit_signin` | Entrar | Iniciar sesión |
| Link under forgotten-password form | `account.back_signin` | Volver a entrar | Volver al inicio de sesión |
| New-password save message | `account.reset_ok` | Tu contraseña está guardada. Entra abajo. | Tu contraseña está guardada. Inicia sesión abajo. |
| Email field | `account.field_email` | Email | Correo electrónico |
| Sign-in screen headline | `account.headline_signin` | Bienvenido de nuevo. | Nos alegra verte de nuevo. |
| Email verified message | `account.verified_ok` | Tu email está verificado. Bienvenido. | Tu correo está verificado. Te damos la bienvenida. |
| Greeting when no name is saved | `account.friend` | amigo | qué bueno verte |
| Forgotten-password message | `account.forgot_sent` | Si ese email es nuestro, el enlace está en camino. | Si ese correo está registrado, recibirás el enlace en unos minutos. |
| Button to shop | `account.go_shop` | Continuar a la tienda | Ir a la tienda |
| Customer area button under order list | `portal.buy_more` | Llevar más aceite a casa | Llévate más aceite a casa |

## 1.10 Newsletter, unsubscribe and order tracking

| Where | Key | Current | Change to |
|---|---|---|---|
| Newsletter pop-up subtitle | `newsletter.sub` | Novedades de la cosecha, lanzamientos exclusivos y recetas, y un 5% en tu primer pedido. | Novedades de la cosecha, lanzamientos exclusivos y recetas, y un 5% de descuento en tu primer pedido. |
| Newsletter email box | `newsletter.placeholder` | Tu email | Correo electrónico |
| Newsletter success headline | `newsletter.done_title_1` | Bienvenido | Te damos la bienvenida |
| Unsubscribe success message | `unsubscribe.done_line` | No más cartas nuestras. El olivar sigue aquí, cuando quieras volver. | No recibirás más cartas nuestras. El olivar sigue aquí, cuando quieras volver. |
| Order tracking email field | `track.field_email` | Email | Correo electrónico |

## 1.11 404 error page

| Where | Key | Current | Change to |
|---|---|---|---|
| Second guarantee box title | `notfound.trust_sourced` | Con cuidado y esmero | Seleccionado con cuidado |
| Second guarantee box line | `notfound.trust_sourced_desc` | Recogido a mano de nuestros olivares | Recogido a mano en nuestros olivares y llevado a tu mesa |

## 1.12 Admin panel - Shop tab

| Where | Key | Current | Change to |
|---|---|---|---|
| Product form | `admin.product_description` | Description | Descripción |
| Product form | `admin.product_category` | Category | Categoría |
| Product form | `admin.product_images` | Photos | Fotos |
| Product form | `admin.pick_image` | Pick existing photo | Elegir una foto existente |
| Product form | `admin.upload_image` | Upload new photo | Subir una foto nueva |
| Product form | `admin.new_product` | New product | Nuevo producto |
| Product form | `admin.create_product` | Create product | Crear producto |
| Product form | `admin.products_count` | products | productos |
| Product form | `admin.featured` | Featured on home | Destacado en la portada |
| Product form | `admin.not_featured` | Not featured | No destacado |
| Product form | `admin.cancel` | Cancel | Cancelar |

---

# 2. Catalan (CA)

## 2.1 Every page - Header, footer, cookie banner

| Where | Key | Current | Change to |
|---|---|---|---|
| Cookie banner, whole banner | - | Cookies / Utilitzem cookies per millorar la teva experiència de navegació i per entendre millor com s'utilitza Nostrum. Tria "Acceptar" per a l'analítica completa o "Rebutjar" per a l'analítica bàsica i no sensible. / Acceptar / Preferències / Rebutjar | Cookies / Utilitzem cookies per millorar la teva experiència de navegació i per entendre millor com s'utilitza Nostrum. Tria "Acceptar" per a l'analítica completa o "Rebutjar" per a l'analítica bàsica i no sensible. / Acceptar / Preferències / Rebutjar |
| Footer address block + same block on Contact | - | El Perelló, Catalonia / Spain, EU | El Perelló, Catalunya / Espanya, UE |
| Footer bottom line | `footer.origin` | Origen Catalunya, Espanya | Origen: Catalunya, Espanya |
| Footer link to Origins | `footer.history` | Història | La Nostra Història |
| Screen-reader label | - | Nostrum home | Inici de Nostrum |
| Screen-reader label | - | open menu | obrir menú |
| Screen-reader label | - | Shopping cart | Cistella de la compra |
| Screen-reader label | - | Account | Compte |
| Screen-reader label | - | Main navigation | Navegació principal |
| Screen-reader label | - | Site footer | Peu de pàgina |
| Screen-reader label | - | Footer navigation | Navegació del peu |
| Screen-reader label | - | Our story | La nostra història |
| Screen-reader label | - | Shop the collection | Comprar la col·lecció |

## 2.2 Browser tab titles

| Where | Key | Current | Change to |
|---|---|---|---|
| Checkout browser tab title | `meta.checkout_title` | Pagament · Nostrum | Pagament · Nostrum |
| Cart browser tab title | `meta.cart_title` | Cistell · Nostrum | Cistella · Nostrum |

## 2.3 Home page

| Where | Key | Current | Change to |
|---|---|---|---|
| Hero, scroll prompt | `hero.scroll` | Desplaça | Desplaça't |
| Hero, second slide headline | `hero.slide1_h1` | Or líquid, abocat | Or líquid, servit |
| Hero button next to "Veure la nostra història" | `hero.explore_products` | Explorar productes | Explora els productes |
| Collection button under product cards | `shop.cta` | Explorar més productes | Explora més productes |
| Product card button | `shop.add` | Afegir al cistell | Afegir a la cistella |
| Story quote, second line | `story.quote2` | premsat en hores | premsat en poques hores |
| Hero image alt text 1 | - | In English, same as Spanish section | Primer pla d'una gota d'oli d'oliva a la vora arrodonida d'un abocador negre mat, amb llum ambre càlida. |
| Hero image alt text 2 | - | In English, same as Spanish section | Primer pla de la superfície brillant de l'oli d'oliva verge extra, amb ones daurades i verdes sota una llum ambre suau. |
| Hero image alt text 3 | - | In English, same as Spanish section | Ampolla Nostrum de vidre ambre fosc recorreguda per un reflex de llum daurada sobre fons negre. |
| Hero image alt text 4 | - | In English, same as Spanish section | Olives madures a la branca de l'oliverar de Nostrum |

## 2.4 Origins page

| Where | Key | Current | Change to |
|---|---|---|---|
| "El lloc" map hidden label | `map.aria` | On és el camp | On és l'oliverar |
| "La collita" scene caption | `scenes.s2_c2` | a hores de la premsa | a poques hores del molí |
| "Com s'elabora", step 4 | `process.step4_copy` | Separat per sota de 27°C, perquè res del fruit no es perdi. | Separat per sota de 27 °C, perquè res del fruit no es perdi. |
| Image alt text 1 | - | In English, same as Spanish section | Olivera centenària sobre la costa mediterrània a l'hora daurada |
| Image alt text 2 | - | In English, same as Spanish section | Unes mans colrades passen olives acabades de collir a unes mans joves |
| Image alt text 3 | - | In English, same as Spanish section | Olives caient d'una caixa de fusta a l'alba |
| Image alt text 4 | - | In English, same as Spanish section | Fulles i fruit de l'olivera / Superfície de l'oli d'oliva / Oli acabat de sortir de la premsa / Reflex a l'espatlla de l'ampolla |

## 2.5 Shop and product page

| Where | Key | Current | Change to |
|---|---|---|---|
| Main buy button | `product.add_to_cart` | Afegir al cistell | Afegir a la cistella |
| Buy button after click | `product.added_to_cart` | Afegit al cistell | Afegit a la cistella |
| Label above 2L / 5L selector | `product.size` | Mida | Format |
| Description tab, first line | `product.desc_1` | Elaborat amb olives de collita primerenca, extret en fred en hores per conservar el màxim sabor, aroma i nutrients. | Elaborat amb olives de collita primerenca, extret en fred en poques hores per conservar el màxim sabor, aroma i nutrients. |
| Shipping tab, second line | `product.shipping_2` | Embotellat sota comanda i embalet en packaging protector i reciclable. | Embotellat sota comanda i embalat en un envàs protector i reciclable. |
| Third badge | `product.returns` | Devolució 14 dies | Devolucions en 14 dies |
| Details tab, acidity | `product.detail_acidity_value` | ≤ 0,3% | ≤ 0,3 % |
| Screen-reader labels | - | Breadcrumb / Product image / Product details / More information | Ruta de navegació / Imatge del producte / Detalls del producte / Més informació |

## 2.6 Journal

### Article translations and routing requirement

The three article titles, the three summaries, the full article text, and the article web addresses currently appear in English inside the Catalan site.

**Requirement:**
1. Add a Catalan title for each article in the admin panel.
2. Add a Catalan summary for each article in the admin panel.
3. Add the full Catalan article text for each article in the admin panel.
4. Add a Catalan web address/slug for each article in the admin panel.
5. Until an article has its Catalan version, it must **not appear** on the Catalan Journal.

### Journal copy changes

| Where | Key | Current | Change to |
|---|---|---|---|
| Museum first-room caption | `journal.room_grove_sub` | Arbres vells, sòl prim, paciència mesurada en dècades. | Oliveres velles, sòl pobre, paciència mesurada en dècades. |
| Museum third-room caption | `journal.room_mill_sub` | De la branca a la premsa en hores, mai en dies. | De la branca al molí en hores, mai en dies. |
| Journal top scroll prompt | `journal.scroll_hint` | Recórrer | Recorre el museu |
| Link under each article | `journal.read_story` | Llegir | Llegir la història |
| Bottom-of-article shop button | `journal.to_shop` | Portar l'oli a casa | Endu-te l'oli a casa |
| Article date formatting | - | `4 d’agost del 2026` (curved apostrophe) | `4 d'agost del 2026` (straight apostrophe) |

## 2.7 Contact page

| Where | Key | Current | Change to |
|---|---|---|---|
| Paragraph under "Parlem." | `contact.lede` | Una comanda, una pregunta, una cuina professional, escriu-nos. Responem personalment. | Una comanda, una pregunta, una cuina professional? Escriu-nos. Responem personalment. |
| Contact email field | `contact.field_email` | El teu email | El teu correu electrònic |
| Contact message placeholder | `contact.placeholder_general` | Unes poques paraules són suficients… | N'hi ha prou amb unes poques paraules… |

## 2.8 Cart and checkout

| Where | Key | Current | Change to |
|---|---|---|---|
| Checkout order summary free-shipping line | `checkout.free` | Gratis | Gratuït |
| Address form line 1 | `checkout.address_line1` | Adreça línia 1 | Adreça |
| Address form line 2 | `checkout.address_line2` | Adreça línia 2 (opcional) | Adreça, segona línia (opcional) |
| Second guarantee box | `checkout.trust_quality_note` | Oli d'oliva verge extra autèntic | 100% oli d'oliva verge extra autèntic |
| Confirmation delivery address heading | `checkout_success.delivery_address` | Adreça d'entrega | Adreça de lliurament |
| Confirmation heading over product list | `checkout_success.items_ordered` | Articles demanats | Articles de la comanda |

## 2.9 Account and customer area

| Where | Key | Current | Change to |
|---|---|---|---|
| Account first tab | `account.tab_signin` | Entrar | Iniciar sessió |
| Sign-in form main button | `account.submit_signin` | Entrar | Iniciar sessió |
| Link under forgotten-password form | `account.back_signin` | Tornar a entrar | Tornar a l'inici de sessió |
| Sign-in screen headline | `account.headline_signin` | Benvingut de nou. Ens alegra tornar-te a veure. | - **No replacement text was supplied in the review; keep the existing text.** |
| Email verified message | `account.verified_ok` | El teu email està verificat. Benvingut. | El teu correu està verificat. Et donem la benvinguda. |
| Greeting when no name saved | `account.friend` | amic | quin gust de veure't |
| Orders heading | `portal.active_title` | De camí | En camí |
| Customer area button | `portal.buy_more` | Portar més oli a casa | Endu-te més oli a casa |
| Empty customer-area copy (apostrophe) | `portal.empty_lede` | des d’aquí | des d'aquí |
| Shipping destination label (apostrophe) | `portal.ships_to` | S’envia a | S'envia a |
| Shipping title (apostrophe) | `portal.shipping_title` | Adreça d’enviament | Adreça d'enviament |

## 2.10 Newsletter and unsubscribe page

| Where | Key | Current | Change to |
|---|---|---|---|
| Newsletter subtitle | `newsletter.sub` | Novetats de la collita, llançaments exclusius i receptes, i un 5% en la teva primera comanda. | Novetats de la collita, llançaments exclusius i receptes, i un 5% de descompte en la teva primera comanda. |
| Newsletter email field | `newsletter.placeholder` | El teu email | Correu electrònic |
| Newsletter success headline | `newsletter.done_title_1` | Benvingut | Et donem la benvinguda |
| Unsubscribe success message | `unsubscribe.done_line` | No més cartes nostres. L'oliverar segueix aquí, quan vulguis tornar. | No rebràs més cartes nostres. L'oliverar segueix aquí, quan vulguis tornar. |

## 2.11 404 error page

| Where | Key | Current | Change to |
|---|---|---|---|
| Second guarantee box title | `notfound.trust_sourced` | Amb cura i esmero | Seleccionat amb cura |
| Second guarantee box line | `notfound.trust_sourced_desc` | Recollit a mà dels nostres olivars | Collit a mà als nostres oliverars i portat a taula |

## 2.12 Admin panel

| Where | Key | Current | Change to |
|---|---|---|---|
| Shop product form | `admin.product_description` | Description | Descripció |
| Shop product form | `admin.product_category` | Category | Categoria |
| Shop product form | `admin.product_images` | Photos | Fotos |
| Shop product form | `admin.pick_image` | Pick existing photo | Triar una foto existent |
| Shop product form | `admin.upload_image` | Upload new photo | Pujar una foto nova |
| Shop product form | `admin.new_product` | New product | Nou producte |
| Shop product form | `admin.create_product` | Create product | Crear producte |
| Shop product form | `admin.products_count` | products | productes |
| Shop product form | `admin.featured` | Featured on home | Destacat a la portada |
| Shop product form | `admin.not_featured` | Not featured | No destacat |
| Shop product form | `admin.cancel` | Cancel | Cancel·lar |
| Content tab note | `admin.content_note` | Les imatges de la secció «Com es fa» de la pàgina Orígens. | Les imatges de la secció «Com s'elabora» de la pàgina Orígens. |
| Shop pack-discounts table first column | `admin.pack_qty` | Des d’uts. | A partir d'unitats |

---

# 3. Italian (IT)

## 3.1 Every page - Header, footer, cookie banner

| Where | Key | Current | Change to |
|---|---|---|---|
| Cookie banner, whole banner | - | Cookie / Usiamo i cookie per migliorare la tua esperienza di navigazione e per capire meglio come viene usato Nostrum. Scegli "Accetta" per le analisi complete o "Rifiuta" solo per le analisi di base non sensibili. / Accetta / Preferenze / Rifiuta | Cookie / Usiamo i cookie per migliorare la tua esperienza di navigazione e per capire meglio come viene usato Nostrum. Scegli "Accetta" per le analisi complete o "Rifiuta" solo per le analisi di base non sensibili. / Accetta / Preferenze / Rifiuta |
| Footer address block + same block on Contact | - | El Perelló, Catalonia / Spain, EU | El Perelló, Catalogna / Spagna, UE |
| Footer bottom line | `footer.origin` | Origine Catalogna, Spagna | Origine: Catalogna, Spagna |
| Footer Origins link | `footer.history` | Storia | La Nostra Storia |
| Journal naming across main menu, footer, full-screen menu, Journal page and admin panel | `nav.journal`, `footer.journal`, `curtain.journal`, `journal.eyebrow`, `admin.tab_journal`, `admin.journal_mode` | Giornale / Il giornale | Journal, everywhere |
| Screen-reader label | - | Nostrum home | Home di Nostrum |
| Screen-reader label | - | open menu | apri il menu |
| Screen-reader label | - | Shopping cart | Carrello |
| Screen-reader label | - | Account | Account |
| Screen-reader label | - | Main navigation | Navigazione principale |
| Screen-reader label | - | Site footer | Piè di pagina |
| Screen-reader label | - | Footer navigation | Navigazione del piè di pagina |
| Screen-reader label | - | Our story | La nostra storia |
| Screen-reader label | - | Shop the collection | Acquista la collezione |

## 3.2 Browser tab titles and Google descriptions

| Where | Key | Current | Change to |
|---|---|---|---|
| Checkout browser tab title | `meta.checkout_title` | Pagamento · Nostrum | Pagamento · Nostrum |
| Origins page Google description | `meta.origins_description` | Dove inizia Nostrum. Il frantoio, la famiglia e come viene prodotto l'olio. | Dove inizia Nostrum. L'uliveto, la famiglia e come nasce l'olio. |
| Journal page Google description | `meta.journal_description` | Storie dal frantoio. Il giornale Nostrum. | Storie dall'uliveto. Il Journal di Nostrum. |
| Journal browser tab title | `meta.journal_title` | Giornale · Nostrum | Journal · Nostrum |
| Home page Google description | `meta.home_description` | Nostrum non è semplicemente olio d'oliva. Un'esperienza di marca di lusso, prima la storia, poi il prodotto. | Nostrum non è semplicemente olio d'oliva. Un'esperienza di lusso: prima la storia, poi il prodotto. |

## 3.3 Home page

| Where | Key | Current | Change to |
|---|---|---|---|
| Hero, second slide headline | `hero.slide1_h1` | Oro liquido, versato | Oro liquido che scorre |
| 2L product card label | `shop.detail_twolitre` | 2L · Extra Vergine | 2L · Extravergine |
| Hero image alt text 1 | - | In English, same as Spanish section | Primo piano di una goccia di olio d'oliva sul bordo arrotondato di un beccuccio nero opaco, con luce ambrata calda. |
| Hero image alt text 2 | - | In English, same as Spanish section | Primo piano della superficie lucida dell'olio extravergine di oliva, con onde dorate e verdi sotto una luce ambrata soffusa. |
| Hero image alt text 3 | - | In English, same as Spanish section | Bottiglia Nostrum in vetro ambra scuro attraversata da un riflesso di luce dorata su fondo nero. |
| Hero image alt text 4 | - | In English, same as Spanish section | Olive mature sul ramo nell'uliveto di Nostrum |

## 3.4 Origins page

| Where | Key | Current | Change to |
|---|---|---|---|
| "Il luogo" map hidden label | `map.aria` | Dove si trova il bosco | Dove si trova l'uliveto |
| "Il luogo" sea name | `map.sea` | Mar Mediterrània | Mar Mediterraneo |
| "La terra" scene caption | `scenes.s0_c1` | due secoli di età | due secoli di storia |
| "La famiglia" scene caption | `scenes.s1_c2` | il prossimo paio | il prossimo paio di mani |
| "Il raccolto" scene caption | `scenes.s2_c2` | a ore dalla pressa | a poche ore dal frantoio |
| Image alt text 1 | - | In English, same as Spanish section | Olivo secolare sulla costa mediterranea nell'ora dorata |
| Image alt text 2 | - | In English, same as Spanish section | Mani segnate dal tempo passano olive appena raccolte a mani più giovani |
| Image alt text 3 | - | In English, same as Spanish section | Olive che cadono da una cassetta di legno all'alba |
| Image alt text 4 | - | In English, same as Spanish section | Foglie e frutti dell'olivo / Superficie dell'olio d'oliva / Olio appena uscito dal frantoio / Riflesso sulla spalla della bottiglia |

## 3.5 Shop and product page

| Where | Key | Current | Change to |
|---|---|---|---|
| Product details origin row | `product.detail_origin_value` | Prodotto di Spagna | Prodotto in Spagna |
| Product highlights | `product.highlight_5` | Prodotto di Spagna | Prodotto in Spagna |
| Description tab, second line | `product.desc_2` | Morbido, equilibrato e verde. Per cucinare ogni giorno, condimenti e finitura. | Morbido, equilibrato e verde. Per la cucina di ogni giorno, per condire e a crudo. |
| Screen-reader labels | - | Breadcrumb / Product image / Product details / More information | Percorso di navigazione / Immagine del prodotto / Dettagli del prodotto / Maggiori informazioni |

## 3.6 Journal

### Article translations and routing requirement

The three article titles, the three summaries, the full article text, and the article web addresses currently appear in English inside the Italian site.

**Requirement:**
1. Add an Italian title for each article in the admin panel.
2. Add an Italian summary for each article in the admin panel.
3. Add the full Italian article text for each article in the admin panel.
4. Add an Italian web address/slug for each article in the admin panel.
5. Until an article has its Italian version, it must **not appear** on the Italian Journal.

### Journal copy changes

| Where | Key | Current | Change to |
|---|---|---|---|
| Museum first-room caption | `journal.room_grove_sub` | Alberi antichi, terra sottile, pazienza misurata in decenni. | Alberi antichi, terreno povero, pazienza misurata in decenni. |
| Museum third-room caption | `journal.room_mill_sub` | Dal ramo alla pressa in ore, mai in giorni. | Dal ramo al frantoio in ore, mai in giorni. |
| Journal top scroll prompt | `journal.scroll_hint` | Percorrere | Attraversa |
| Link under each article | `journal.read_story` | Leggere | Leggi |
| Article back-to-Journal link | `journal.back` | Tornare al giornale | Torna al Journal |
| Bottom-of-article shop button | `journal.to_shop` | Portare l'olio a casa | Porta l'olio a casa |

## 3.7 Contact page

| Where | Key | Current | Change to |
|---|---|---|---|
| Paragraph under "Parliamo." | `contact.lede` | Un ordine, una domanda, una cucina professionale, scrivici. Rispondiamo personalmente. | Un ordine, una domanda, una cucina professionale? Scrivici. Rispondiamo personalmente. |

## 3.8 Cart and checkout

| Where | Key | Current | Change to |
|---|---|---|---|
| First checkout guarantee box | `checkout.trust_secure` | Checkout sicuro | Pagamento sicuro |
| Line above address form | `checkout.review_intro` | Si prega di rivedere i dettagli prima di procedere al pagamento. | Rivedi i tuoi dati prima di procedere al pagamento. |
| Second checkout guarantee box | `checkout.trust_quality_note` | Olio extravergine di oliva autentico | 100% olio extravergine di oliva autentico |
| Cart panel main button | `cart.checkout` | Procedi all'ordine | Vai al pagamento |
| Cart panel + confirmation link back to shop | `cart.continue`, `checkout_success.continue_shopping` | Continua lo shopping | Continua gli acquisti |
| Suggested-products link | `cart.add_more` | Aggiungi altro dallo shop | Aggiungi altri prodotti dallo shop |
| Order confirmation loading message | `checkout_success.loading_order` | Conferma del tuo ordine in corso | Stiamo confermando il tuo ordine |

## 3.9 Account and customer area

| Where | Key | Current | Change to |
|---|---|---|---|
| Button to shop; public site calls section "Shop" | `account.go_shop` | Continua al negozio | Vai allo Shop |
| Sign-in screen headline | `account.headline_signin` | Bentornato. | Che bello rivederti. |
| Email verified message | `account.verified_ok` | La tua email è verificata. Benvenuto. | La tua email è verificata. Ti diamo il benvenuto. |
| Greeting when no name saved | `account.friend` | amico | che bello vederti |

## 3.10 Newsletter

| Where | Key | Current | Change to |
|---|---|---|---|
| Newsletter subtitle | `newsletter.sub` | Novità dal raccolto, uscite esclusive e ricette, e il 5% sul tuo primo ordine. | Novità dal raccolto, uscite esclusive e ricette, e il 5% di sconto sul tuo primo ordine. |
| Newsletter consent link | `newsletter.consent_link` | Privacy Policy | Informativa sulla privacy |
| Newsletter success headline | `newsletter.done_title_1` | Benvenuto | Ti diamo il benvenuto |

## 3.11 404 error page

| Where | Key | Current | Change to |
|---|---|---|---|
| Second guarantee box line | `notfound.trust_sourced_desc` | Raccolto a mano dai nostri oliveti | Raccolto a mano nei nostri uliveti e portato in tavola |

## 3.12 Admin panel

| Where | Key | Current | Change to |
|---|---|---|---|
| Shop product form | `admin.product_description` | Description | Descrizione |
| Shop product form | `admin.product_category` | Category | Categoria |
| Shop product form | `admin.product_images` | Photos | Foto |
| Shop product form | `admin.pick_image` | Pick existing photo | Scegli una foto esistente |
| Shop product form | `admin.upload_image` | Upload new photo | Carica una nuova foto |
| Shop product form | `admin.new_product` | New product | Nuovo prodotto |
| Shop product form | `admin.create_product` | Create product | Crea prodotto |
| Shop product form | `admin.products_count` | products | prodotti |
| Shop product form | `admin.featured` | Featured on home | In evidenza in home |
| Shop product form | `admin.not_featured` | Not featured | Non in evidenza |
| Shop product form | `admin.cancel` | Cancel | Annulla |
| Last admin-panel tab | `admin.tab_audit` | Audit | Registro attività |
| Content tab note | `admin.content_note` | Le immagini della sezione «Come è fatto» nella pagina Origini. | Le immagini della sezione «Come nasce» nella pagina Origini. |

---

# 4. Greek (EL)

## 4.1 Every page - Header, footer, cookie banner

| Where | Key | Current | Change to |
|---|---|---|---|
| Cookie banner, whole banner | - | Cookies / Χρησιμοποιούμε cookies για να βελτιώσουμε την εμπειρία περιήγησής σας και για να κατανοήσουμε καλύτερα πώς χρησιμοποιείται το Nostrum. Επιλέξτε "Αποδοχή" για πλήρη ανάλυση ή "Απόρριψη" μόνο για βασική, μη ευαίσθητη ανάλυση. / Αποδοχή / Προτιμήσεις / Απόρριψη | Cookies / Χρησιμοποιούμε cookies για να βελτιώσουμε την εμπειρία περιήγησής σας και για να κατανοήσουμε καλύτερα πώς χρησιμοποιείται το Nostrum. Επιλέξτε "Αποδοχή" για πλήρη ανάλυση ή "Απόρριψη" μόνο για βασική, μη ευαίσθητη ανάλυση. / Αποδοχή / Προτιμήσεις / Απόρριψη |
| Footer address block + same block on Contact | - | El Perelló, Catalonia / Spain, EU | El Perelló, Καταλονία / Ισπανία, ΕΕ |
| Footer origin line | `footer.origin` | Καταγωγή Καταλονία, Ισπανία | Προέλευση: Καταλονία, Ισπανία |
| Footer link to Origins | `footer.history` | Ιστορία | Η Ιστορία μας |
| Origins entry in main menu/full-screen menu | `nav.origins`, `curtain.origins` | Καταγωγή / Η Καταγωγή μας | Οι ρίζες μας / Οι Ρίζες μας |
| Order tracking entry in main menu/footer | `nav.track`, `footer.track` | Παρακολούθηση | Παρακολούθηση παραγγελίας |
| Journal naming across main menu, footer, full-screen menu, Journal, newsletter and admin | `nav.journal`, `footer.journal`, `curtain.journal`, `journal.eyebrow`, `newsletter.eyebrow`, `admin.tab_journal` | Ημερολόγιο / Το ημερολόγιο | Journal, everywhere |
| Screen-reader label | - | Nostrum home | Αρχική Nostrum |
| Screen-reader label | - | open menu | άνοιγμα μενού |
| Screen-reader label | - | Shopping cart | Καλάθι αγορών |
| Screen-reader label | - | Account | Λογαριασμός |
| Screen-reader label | - | Main navigation | Κύρια πλοήγηση |
| Screen-reader label | - | Site footer | Υποσέλιδο |
| Screen-reader label | - | Footer navigation | Πλοήγηση υποσέλιδου |
| Screen-reader label | - | Our story | Η ιστορία μας |
| Screen-reader label | - | Shop the collection | Αγοράστε τη συλλογή |

## 4.2 Browser tab titles and Google descriptions

| Where | Key | Current | Change to |
|---|---|---|---|
| Checkout browser tab title | `meta.checkout_title` | Ολοκλήρωση αγοράς · Nostrum | Ολοκλήρωση αγοράς · Nostrum |
| Products page Google description | `meta.products_description` | Η συλλογή Nostrum. Premium παρθένο ελαιόλαδο από την Καταλονία. | Η συλλογή Nostrum. Κορυφαίο εξαιρετικό παρθένο ελαιόλαδο από την Καταλονία. |
| Origins browser tab title | `meta.origins_title` | Καταγωγή · Nostrum | Οι ρίζες μας · Nostrum |
| Journal browser tab title | `meta.journal_title` | Ημερολόγιο · Nostrum | Journal · Nostrum |
| Account Google description | `meta.account_description` | Ο λογαριασμός σου στη Nostrum. Παραγγελίες, στοιχεία και άλλα. | Ο λογαριασμός σας στη Nostrum. Παραγγελίες, στοιχεία και άλλα. |
| Order tracking Google description | `meta.track_description` | Παρακολούθησε την παραγγελία σου στη Nostrum με αριθμό παραγγελίας και email. | Παρακολουθήστε την παραγγελία σας στη Nostrum με αριθμό παραγγελίας και email. |

## 4.3 Home page

| Where | Key | Current | Change to |
|---|---|---|---|
| Hero, second slide headline | `hero.slide1_h1` | Υγρός χρυσός, χυμένος | Υγρός χρυσός που ρέει |
| Hero, third slide subheadline | `hero.slide2_sub` | Ρεζέρβα κτήματος Nostrum | Επιλογή κτήματος Nostrum |
| Hero, first-slide scroll prompt | `hero.scroll` | Κύλιση | Κάντε κύλιση |
| Story quote, second line | `story.quote2` | πιεσμένο μέσα σε ώρες | σε λίγες μόνο ώρες |
| Story small button | `story.pill` | Η καταγωγή μας | Οι ρίζες μας |
| Collection button | `shop.cta` | Περισσότερα προϊόντα | Ανακαλύψτε περισσότερα προϊόντα |
| Product name Duo | `shop.product_duo` | Δύο | Duo |
| Product name Trio | `shop.product_trio` | Τρία | Trio |
| Product name Single | `shop.product_single` | Μονό | Μονή φιάλη |
| 2L product card label | `shop.detail_twolitre` | 2L · Παρθένο Ελαιόλαδο | 2L · Εξαιρετικό Παρθένο |
| B2B link | `shop.b2b` | Ερωτήσεις B2B | Αιτήματα χονδρικής |
| Hero image alt text 1 | - | In English, same as Spanish section | Κοντινό πλάνο σταγόνας ελαιολάδου στο στρογγυλεμένο χείλος ενός ματ μαύρου στομίου, με ζεστό κεχριμπαρένιο φως. |
| Hero image alt text 2 | - | In English, same as Spanish section | Κοντινό πλάνο της γυαλιστερής επιφάνειας εξαιρετικού παρθένου ελαιολάδου, με χρυσοπράσινους κυματισμούς σε απαλό κεχριμπαρένιο φως. |
| Hero image alt text 3 | - | In English, same as Spanish section | Σκούρο κεχριμπαρένιο γυάλινο μπουκάλι Nostrum με μια λωρίδα χρυσού φωτός σε μαύρο φόντο. |
| Hero image alt text 4 | - | In English, same as Spanish section | Ώριμες ελιές στο κλαδί, στον ελαιώνα του Nostrum |

## 4.4 Origins page

| Where | Key | Current | Change to |
|---|---|---|---|
| "Ο τόπος" map hidden label | `map.aria` | Πού βρίσκεται το αγρόκτημα | Πού βρίσκεται ο ελαιώνας |
| "Πώς παράγεται", step 4 title | `process.step4_title` | Ψυχρή εκχύλιση | Ψυχρή έκθλιψη |
| "Η οικογένεια" scene caption | `scenes.s1_c2` | το επόμενο ζευγάρι | το επόμενο ζευγάρι χέρια |
| "Η συγκομιδή" scene caption | `scenes.s2_c2` | ώρες από το πιεστήριο | λίγες ώρες από το ελαιοτριβείο |
| "Η συγκομιδή" main paragraph | `scenes.s2_copy` | Μαζεμένο με το πρώτο φως, στην κορύφωση της ωρίμανσης, και πιεσμένο την ίδια μέρα. | Συλλέγεται με το πρώτο φως, στην κορύφωση της ωρίμανσης, και εκθλίβεται την ίδια μέρα. |
| Image alt text 1 | - | In English, same as Spanish section | Αιωνόβια ελιά πάνω από τη μεσογειακή ακτή τη χρυσή ώρα |
| Image alt text 2 | - | In English, same as Spanish section | Ταλαιπωρημένα χέρια δίνουν φρέσκες ελιές σε νεότερα χέρια |
| Image alt text 3 | - | In English, same as Spanish section | Ελιές που πέφτουν από ξύλινο καφάσι την αυγή |
| Image alt text 4 | - | In English, same as Spanish section | Φύλλα και καρποί ελιάς / Επιφάνεια ελαιολάδου / Λάδι που βγαίνει από το ελαιοτριβείο / Αντανάκλαση στον ώμο του μπουκαλιού |

## 4.5 Shop and product page

| Where | Key | Current | Change to |
|---|---|---|---|
| Product highlights | `product.highlight_2` | Ψυχρή εκχύλιση | Ψυχρή έκθλιψη |
| Details extraction row label | `product.detail_extraction` | Εκχύλιση | Έκθλιψη |
| Details extraction row value | `product.detail_extraction_value` | Ψυχρή εκχύλιση, πρώτη πίεση | Πρώτης ψυχρής έκθλιψης |
| Description tab, first line | `product.desc_1` | Παρασκευασμένο από πρώιμης συγκομιδής ελιές, ψυχρής εκχύλισης μέσα σε ώρες για τη διατήρηση μέγιστης γεύσης, αρώματος και θρεπτικών. | Παρασκευασμένο από ελιές πρώιμης συγκομιδής, ψυχρής έκθλιψης μέσα σε λίγες ώρες για τη διατήρηση της μέγιστης γεύσης, του αρώματος και των θρεπτικών συστατικών. |
| Description tab, second line | `product.desc_2` | Απαλό, ισορροπημένο και πράσινο. Για καθημερινό μαγείρεμα, ντρέσινγκ και φινίρισμα. | Απαλό, ισορροπημένο και πράσινο. Για καθημερινό μαγείρεμα, για σαλάτες και για το τελείωμα των πιάτων. |
| Details/highlights variety | `product.detail_variety_value`, `product.highlight_4` | Πρώιμη συγκομιδή, μονό κτήμα / Μονό κτήμα | Πρώιμη συγκομιδή, από ένα μόνο κτήμα / Από ένα μόνο κτήμα |
| Line under price | `product.plus_shipping` | + αποστολή | + μεταφορικά |
| B2B link under buy button | `product.b2b_enquiry` | Επαγγελματικές ερωτήσεις | Αιτήματα χονδρικής |
| Screen-reader labels | - | Breadcrumb / Product image / Product details / More information | Διαδρομή πλοήγησης / Εικόνα προϊόντος / Λεπτομέρειες προϊόντος / Περισσότερες πληροφορίες |

## 4.6 Journal

### Article translations and routing requirement

The three article titles, the three summaries, the full article text, and the article web addresses currently appear in English inside the Greek site.

**Requirement:**
1. Add a Greek title for each article in the admin panel.
2. Add a Greek summary for each article in the admin panel.
3. Add the full Greek article text for each article in the admin panel.
4. Add a Greek web address/slug for each article in the admin panel.
5. Until an article has its Greek version, it must **not appear** on the Greek Journal.

### Journal copy changes

| Where | Key | Current | Change to |
|---|---|---|---|
| Museum headline | `journal.museum_title` | Ένα σπίτι που περπατιέται | Ένα σπίτι που μπορείτε να περπατήσετε |
| Museum third-room caption | `journal.room_mill_sub` | Από το κλαδί στο πιεστήριο σε ώρες, ποτέ σε μέρες. | Από το κλαδί στο ελαιοτριβείο σε ώρες, ποτέ σε μέρες. |
| Bottom-of-article shop button | `journal.to_shop` | Φέρτε το λάδι σπίτι | Φέρτε το λάδι στο σπίτι σας |

## 4.7 Contact page

| Where | Key | Current | Change to |
|---|---|---|---|
| Subject selector label | `contact.field_topic` | Περί τίνος πρόκειται; | Για ποιο θέμα; |
| Send-error message | `contact.send_error` | Κάτι πήγε στραβά. Δοκίμασε να το στείλεις ξανά. | Κάτι πήγε στραβά. Δοκιμάστε να το στείλετε ξανά. |
| Example name in name field | - | María Serra | Μαρία Παπαδοπούλου |

## 4.8 Cart and checkout

| Where | Key | Current | Change to |
|---|---|---|---|
| Checkout eyebrow | `checkout.eyebrow` | Ταμείο | Ολοκλήρωση αγοράς |
| First guarantee box | `checkout.trust_secure` | Ασφαλές ταμείο | Ασφαλής πληρωμή |
| Cart shipping note | `cart.shipping_note` | Τα μεταφορικά υπολογίζονται στο ταμείο. | Τα μεταφορικά υπολογίζονται κατά την ολοκλήρωση της παραγγελίας. |
| Second guarantee box title | `checkout.trust_quality` | Premium ποιότητα | Κορυφαία ποιότητα |
| Second guarantee box line | `checkout.trust_quality_note` | 100% αυθεντικό έξτρα παρθένο ελαιόλαδο | 100% αυθεντικό εξαιρετικό παρθένο ελαιόλαδο |
| Third guarantee box | `checkout.trust_delivery_note` | Προσεκτικά συσκευασμένο και παραδοτέο στην πόρτα σας | Συσκευάζεται με προσοχή και παραδίδεται στην πόρτα σας |
| Order-summary premium note | `checkout.premium_note` | Εξαιρετικό παρθένο ελαιόλαδο premium, προμηθευόμενο με φροντίδα και παραδοτέο στην πόρτα σας. | Κορυφαίο εξαιρετικό παρθένο ελαιόλαδο, επιλεγμένο με φροντίδα, παραδίδεται στην πόρτα σας. |
| Logged-in customer line | `checkout.logged_in_as` | Συνδεδεμένος ως | Έχετε συνδεθεί ως |
| Confirmation shipping row | `checkout_success.shipping` | Αποστολή | Μεταφορικά |

## 4.9 Account and customer area

The review consistently changes the customer/account area from informal second-person forms to formal second-person forms.

| Where | Key | Current | Change to |
|---|---|---|---|
| Sign-in headline | `account.headline_signin` | Καλώς ήρθες ξανά. | Καλώς ήρθατε ξανά. |
| Create-account headline | `account.headline_create` | Γίνε μέλος του οίκου. | Γίνετε μέλος του οίκου. |
| Account intro | `account.lede` | Οι παραγγελίες σου, τα στοιχεία σου, το λάδι σου. Ένα ήσυχο μέρος για όλα. | Οι παραγγελίες σας, τα στοιχεία σας, το λάδι σας. Ένα ήσυχο μέρος για όλα. |
| Forgot-password intro | `account.lede_forgot` | Πες μας το email σου και θα σου στείλουμε έναν σύνδεσμο για νέο κωδικό. | Πείτε μας το email σας και θα σας στείλουμε έναν σύνδεσμο για νέο κωδικό. |
| Forgot-password link | `account.forgot` | Ξέχασες τον κωδικό σου; | Ξεχάσατε τον κωδικό σας; |
| Email verified message | `account.verified_ok` | Το email σου επιβεβαιώθηκε. Καλώς ήρθες. | Το email σας επιβεβαιώθηκε. Καλώς ήρθατε. |
| Forgot-password sent message | `account.forgot_sent` | Αν αυτό το email είναι δικό μας, ο σύνδεσμος είναι καθ΄ οδόν. | Αν το email είναι καταχωρημένο, θα λάβετε τον σύνδεσμο σε λίγα λεπτά. |
| Privacy consent error | `account.error_consent` | Αποδέξου την πολιτική απορρήτου για να συνεχίσεις. | Αποδεχθείτε την πολιτική απορρήτου για να συνεχίσετε. |
| Weak-password error | `account.error_weak_password` | Διάλεξε κωδικό με τουλάχιστον 8 χαρακτήρες. | Διαλέξτε κωδικό με τουλάχιστον 8 χαρακτήρες. |
| Generic error | `account.error_generic` | Κάτι πήγε στραβά. Προσπάθησε ξανά. | Κάτι πήγε στραβά. Προσπαθήστε ξανά. |
| Customer-area greeting | `account.welcome`, `account.friend` | Γεια σου, / φίλε | Γεια σας, / καλώς ήρθατε |
| New-password intro | `account.lede_reset` | Διάλεξε έναν νέο κωδικό για τον λογαριασμό σου. | Διαλέξτε έναν νέο κωδικό για τον λογαριασμό σας. |
| New-password saved message | `account.reset_ok` | Ο κωδικός σου αποθηκεύτηκε. Συνδέσου παρακάτω. | Ο κωδικός σας αποθηκεύτηκε. Συνδεθείτε παρακάτω. |
| Customer area small label | `portal.eyebrow` | Το σπίτι σου | Το σπίτι σας |
| Customer-area load error | `portal.error_load` | Δεν μπορέσαμε να συνδεθούμε με το σπίτι. Δοκίμασε ξανά σε λίγο. | Δεν μπορέσαμε να συνδεθούμε με το σπίτι. Δοκιμάστε ξανά σε λίγο. |
| Empty customer-area copy | `portal.empty_lede` | Όταν το πρώτο σου λάδι ξεκινήσει το ταξίδι του, θα το παρακολουθείς από εδώ. | Όταν το πρώτο σας λάδι ξεκινήσει το ταξίδι του, θα το παρακολουθείτε από εδώ. |
| Orders-on-way heading | `portal.active_title` | Καθ' οδόν | Σε εξέλιξη |
| Customer area button | `portal.buy_more` | Φέρε κι άλλο λάδι στο σπίτι | Φέρτε κι άλλο λάδι στο σπίτι σας |

## 4.10 Newsletter, unsubscribe page and order tracking

| Where | Key | Current | Change to |
|---|---|---|---|
| Newsletter headline | `newsletter.title_1` | Λάβε ιστορίες | Λάβετε ιστορίες |
| Newsletter subtitle | `newsletter.sub` | Νέα της συγκομιδής, αποκλειστικές κυκλοφορίες και συνταγές, και 5% στην πρώτη σου παραγγελία. | Νέα της συγκομιδής, αποκλειστικές κυκλοφορίες και συνταγές, και 5% έκπτωση στην πρώτη σας παραγγελία. |
| Newsletter main button | `newsletter.join` | Γίνε μέλος | Γίνετε μέλος του Journal |
| Newsletter email field | `newsletter.placeholder` | Το email σου | Το email σας |
| Newsletter success headline | `newsletter.done_title_1` | Καλώς ήρθες | Καλώς ήρθατε |
| Newsletter/unsubscribe error | `newsletter.error`, `unsubscribe.error` | Κάτι πήγε στραβά. Δοκίμασε ξανά. | Κάτι πήγε στραβά. Δοκιμάστε ξανά. |
| Unsubscribe headline | `unsubscribe.title` | Φεύγεις από το Ημερολόγιο; | Φεύγετε από το Journal; |
| Unsubscribe intro | `unsubscribe.lede` | Επιβεβαίωσε παρακάτω και οι ιστορίες από τον ελαιώνα θα σταματήσουν να φτάνουν σε αυτή τη διεύθυνση. | Επιβεβαιώστε παρακάτω και οι ιστορίες από τον ελαιώνα θα σταματήσουν να φτάνουν σε αυτή τη διεύθυνση. |
| Unsubscribe success title | `unsubscribe.done_title` | Έφυγες από το Ημερολόγιο. | Φύγατε από το Journal. |
| Unsubscribe success line | `unsubscribe.done_line` | Τέλος τα γράμματα από εμάς. Ο ελαιώνας μένει εδώ, όποτε θελήσεις να επιστρέψεις. | Τέλος τα γράμματα από εμάς. Ο ελαιώνας μένει εδώ, όποτε θελήσετε να επιστρέψετε. |
| Incomplete unsubscribe-link message | `unsubscribe.invalid_line` | Χρησιμοποίησε τον σύνδεσμο απεγγραφής από ένα από τα γράμματά μας. | Χρησιμοποιήστε τον σύνδεσμο απεγγραφής από ένα από τα γράμματά μας. |
| Tracking headline | `track.title` | Ακολούθησε το λάδι σου. | Ακολουθήστε το λάδι σας. |
| Tracking intro | `track.lede` | Γράψε τον αριθμό παραγγελίας και το email της αγοράς. Χωρίς λογαριασμό. | Γράψτε τον αριθμό παραγγελίας και το email της αγοράς. Χωρίς λογαριασμό. |
| Tracking main button | `track.submit` | Βρες την παραγγελία μου | Βρείτε την παραγγελία μου |
| Tracking order-not-found message | `track.not_found` | Δεν βρήκαμε αυτή την παραγγελία. Έλεγξε τον αριθμό και το email και δοκίμασε ξανά. | Δεν βρήκαμε αυτή την παραγγελία. Ελέγξτε τον αριθμό και το email και δοκιμάστε ξανά. |
| Tracking error | `track.error` | Κάτι πήγε στραβά. Δοκίμασε ξανά. | Κάτι πήγε στραβά. Δοκιμάστε ξανά. |

## 4.11 404 error page

| Where | Key | Current | Change to |
|---|---|---|---|
| First guarantee box title | `notfound.trust_quality` | Premium ποιότητα | Κορυφαία ποιότητα |
| Second guarantee box line | `notfound.trust_sourced_desc` | Μαζεμένο στο χέρι από τους ελαιώνες μας | Συλλέγεται στο χέρι από τους ελαιώνες μας και φτάνει στο τραπέζι σας |

## 4.12 Admin panel

| Where | Key | Current | Change to |
|---|---|---|---|
| Shop product form | `admin.product_description` | Description | Περιγραφή |
| Shop product form | `admin.product_category` | Category | Κατηγορία |
| Shop product form | `admin.product_images` | Photos | Φωτογραφίες |
| Shop product form | `admin.pick_image` | Pick existing photo | Επιλογή υπάρχουσας φωτογραφίας |
| Shop product form | `admin.upload_image` | Upload new photo | Μεταφόρτωση νέας φωτογραφίας |
| Shop product form | `admin.new_product` | New product | Νέο προϊόν |
| Shop product form | `admin.create_product` | Create product | Δημιουργία προϊόντος |
| Shop product form | `admin.products_count` | products | προϊόντα |
| Shop product form | `admin.featured` | Featured on home | Προβολή στην αρχική |
| Shop product form | `admin.not_featured` | Not featured | Χωρίς προβολή |
| Shop product form | `admin.cancel` | Cancel | Ακύρωση |
| Content tab note | `admin.content_note` | Οι εικόνες της ενότητας «Πώς φτιάχνεται» στη σελίδα Origins. | Οι εικόνες της ενότητας «Πώς παράγεται» στη σελίδα Οι ρίζες μας. |

---

# 5. Implementation notes extracted from the review

## Journal content gating

For **Spanish, Catalan, Italian, and Greek**, the review explicitly requires that an article must have a localized title, summary, full text, and localized web address/slug before it is shown in that language's Journal. Do not display an untranslated English article in a localized Journal.

## Italian Journal naming

Replace the site's inconsistent use of **Giornale / Il giornale** with **Journal** everywhere listed in the review.

## Greek Journal naming

Replace **Ημερολόγιο / Το ημερολόγιο** with **Journal** everywhere listed in the review.

## Greek formality

The Greek account, newsletter, unsubscribe, tracking, customer-area, and contact error strings listed above must use the formal second-person forms requested in the review.

## Catalan punctuation consistency

Use the straight apostrophe (`'`) in the listed Catalan customer-area strings and article date, replacing the curved apostrophe (`’`).

## Product terminology explicitly corrected by the review

- Spanish: use **almazara** where the review replaces **molino/prensa** in the specified production context.
- Catalan: use **molí** where the review replaces **premsa** in the specified production context.
- Italian: use **frantoio** and **uliveto** where specified.
- Greek: use **ελαιοτριβείο**, **έκθλιψη**, and **εξαιρετικό παρθένο** where specified, instead of the incorrect alternatives called out in the review.

## SEO and accessibility

The review includes browser titles, Google descriptions, image descriptions/alt text, and screen-reader labels. These are part of the required changes and should be implemented alongside visible UI copy.

---

# 6. Completion checklist

- [ ] Spanish: all header/footer/cookie changes
- [ ] Spanish: SEO titles/descriptions
- [ ] Spanish: Home changes
- [ ] Spanish: Origins changes
- [ ] Spanish: Shop/product changes
- [ ] Spanish: Journal localization + gating
- [ ] Spanish: Contact changes
- [ ] Spanish: Cart/checkout changes
- [ ] Spanish: Account/customer-area changes
- [ ] Spanish: Newsletter/unsubscribe/tracking changes
- [ ] Spanish: 404 changes
- [ ] Spanish: Admin changes
- [ ] Catalan: all header/footer/cookie changes
- [ ] Catalan: SEO/browser titles
- [ ] Catalan: Home changes
- [ ] Catalan: Origins changes
- [ ] Catalan: Shop/product changes
- [ ] Catalan: Journal localization + gating
- [ ] Catalan: Contact changes
- [ ] Catalan: Cart/checkout changes
- [ ] Catalan: Account/customer-area changes
- [ ] Catalan: Newsletter/unsubscribe changes
- [ ] Catalan: 404 changes
- [ ] Catalan: Admin changes
- [ ] Italian: all header/footer/cookie changes
- [ ] Italian: Journal naming normalization
- [ ] Italian: SEO/browser titles
- [ ] Italian: Home changes
- [ ] Italian: Origins changes
- [ ] Italian: Shop/product changes
- [ ] Italian: Journal localization + gating
- [ ] Italian: Contact changes
- [ ] Italian: Cart/checkout changes
- [ ] Italian: Account/customer-area changes
- [ ] Italian: Newsletter changes
- [ ] Italian: 404 changes
- [ ] Italian: Admin changes
- [ ] Greek: all header/footer/cookie changes
- [ ] Greek: Origins/order-tracking/Journal naming changes
- [ ] Greek: SEO/browser titles
- [ ] Greek: Home changes
- [ ] Greek: Origins changes
- [ ] Greek: Shop/product changes
- [ ] Greek: Journal localization + gating
- [ ] Greek: Contact changes
- [ ] Greek: Cart/checkout changes
- [ ] Greek: Account/customer-area formalization
- [ ] Greek: Newsletter/unsubscribe/tracking changes
- [ ] Greek: 404 changes
- [ ] Greek: Admin changes
