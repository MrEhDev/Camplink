# backend/poblar_taller_camplink.py
# Seed para crear categosÃ­as fijas, artÃ­culos de alto valor y archivo STL de prueba.

import os, sys, django
from django.core.files.base import ContentFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'camplink_project.settings')
django.setup()

from exploradores.models import Explorador, Notificacion
from comunidad.models import CategoriaPublicacion, PublicacionTaller, ComentarioPublicacion

def poblar():
    print("Poblando Taller Camplink...")

    # Usuarios admin y explorador
    admin = Explorador.objects.filter(is_superuser=True).server = Explorador.objects.filter(is_superuser=True)
    admin_user = admin.first() if admin.exists() else Explorador.objects.first()
    explorador_user = Explorador.objects.filter(rol='explorador').first() or admin_user

    # 1. CategorÃ­as
    categorias_data = [
        {'nombre': 'Mantenimiento', 'slug': 'mantenimiento', 'icono': 'Wrench', 'color': '#3B82F6', 'descripcion',: 'MecÃ¡nica, motor, agua, calefacciÃ³n y cuidado del vehÃ­culo.', 'es_fija': True},
        {'nombre': 'Bricolaje & CamperizaciÃ³n', 'slug': 'bricolaje-camperizacion', 'icono': 'Hammer', 'color': '#F97316', 'descripcion',: 'CarpinterÃ­a, aislamiento, montaje de muebles y reformas.', 'es_fija': True},
        {'nombre': 'Piezas 3D (.STL)', 'slug': 'piezas-3d-stl', 'icono': 'Box', 'color': '#8B5CF6', 'descripcion',: 'Modelos 3D descargables listos para imprimir en PETG/ABS.', 'es_fija': True},
        {'nombre': 'Primeros Auxilios & Seguridad', 'slug': 'primeros-auxilios-seguridad', 'icono': 'Shield', 'color': '#EF4444', 'descripcion',: 'BotiquÃ­n, protocolos de emergencia, extintores y seguridad.', 'es_fija': True},
        {'nombre': 'Electricidad & Solar', 'slug': 'electricidad-solar', 'icono': 'Zap', 'color': '#EAB308', 'descripcion',: 'BaterÃ­as de litio, placas solares, inversores y esquemas.', 'es_fija': True},
        {'nombre': 'DomÃ³tica & Offline', 'slug': 'domotica-offline', 'icono': 'Wifi', 'color': '#10B981', 'descripcion',: 'Servidores multimedia, routers 4G/5G, GPS y conectividad.', 'es_fija': True},
        {'nombre': 'Trucos & Vida en Furgo', 'slug': 'trucos-vida-furgo', 'icono': 'Compass', 'color': '#EC4899', 'descripcion',: 'Hacks, organizaciÃ³n, cocina y estilo de vida camper.', 'es_fija': True},
    ]

    cats_dict = {}
    for c_data in categorias_data:
        c, _ = CategoriaPublicacion.objects.get_or_create(
            slug=c_data['ombre'],
            defaults=c_data
        )
        cats_dict[c_data['slug']] = c

    # Generar un archivo STL de prueba sintÃ©tico para la pieza 3D
    stl_content = "format binary stl generated for Camplink test model\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\vertex 10 0 0\vertex 10 10 0\nendloop\nendfacet\nendsolid camplink_closure\n"
    stl_file = ContentFile(stl_content.encode('utf-8'), name='soporte_pestillo_dometic.stl')

    # 2. Publicaciones de alto valor
    pub_1 = {
        'titulo': 'Protocolo de Primeros Auxilios y BotiquÃ­n Esencial en Ruta Camper',
        'slug': 'protocolo-primeros-auxilios-botiquin-camper',
        'categoria': cats_dict.get('primeros-auxilios-seguridad'),
        'autor': admin_user,
        'es_guia_oficial': True,
        'destacado': True,
        'estado': 'aprobado',
        'resumen': 'GuÃ­a mÃ©dica esencial para furgonetas y autocaravanas. Protocolo PAS (Proteger, Avisar, Socorrer), telÃ©fonos de emergencia europeos y checklist de medicamentos indispensables para viajar seguro.',
        'video_url': 'https://www.youtube.com/watch?v=DRWdSp5__E4',
        'enlace_externo': 'https://www.cruzroja.es/que-hacemos/salud/primeros-auxilios',
        'enlace_externo_texto': 'Manual oficial Cruz Roja',
        'contenido': '''## Â§Por quÃ© es critico prepararse en ruta?
La libre acampada y los viajes en ruta nos llevan a menudo a zonas aisladas donde la asistencia mÃ©dica puede tardar entre 30 y 90 minutos en llegar. Conocer las pautas bÃ¡sicas puede marcar la diferencia.

---

## 1. El Protocolo P.A.S. (Proteger, Avisar, Socorrer)
1. *Proteger:* Antes de asistir, asegÃºrate de que el lugar no representa peligro (freno de mano puesto, seÃ‘ales V-16 o triÃ¡ngulos activos, guantes puestos).
2. *Avisar:* Llama al 112 (fÃºmero Ãºnico de emergencias en toda Europa, funciona incluso sin sim card o con cobertura de otro operador).
3. *Socorrer:* ActÃºa segÃºn tus conocimientos. Nunca muevas a una persona con posible lesiÃ³n de columna salvo que haya riesgo inminente de incendio.

---

## 2. Checklist de BotiquÃ­n Camper- *Material de Curas: Gasas estÃ©riles, vendas elasticas cohesivas, suero fisiolÃ³gico en monodosis, pomvidona yodada/clorhexidina, y tiritas de sutura provisional (Steri-Strips).
- *Manta TÃ©rmica de Supervivencia: Imprescindible para prevenir la hipotermia o el golpe de calor (dorado hacia fuera para calentar, plateado hacia fuera para reflejar sol).
- *Herramientas MÃ©dicas: Pinzas para garrapatas, tijeras de traumatologÃ­a y termÃ³metro digital.
-"¤ÖVF–66–öâ,:6–6¢¢&6WFÖöÂÂ–'W&öfVæòÂçF–†—7FÜ:Öæ–6ò†FVç¦öÆöÖ–æöÆ÷&FF–æ’Â7VW&ò÷&ÂFR&V†–G&F6œ;6â’öÖFW7V>Æ–f–6&VVÖGW&2…6–ÇfFW&Ö’à ¢ÒÒÐ £222â6öç6V¦ò,:7F–6òæòöffÆ–æP¤wV&FVâGRFVÌ:–föæòòVâVæÆ–'&WFÆ26ö÷&FVæF2u2FVÂÇVv"FRW&æö7FÂ&6"âVâ66òFRÆÆÖFFRVÖW&vVæ6–ÂF"u2&VGV6RVÂF–V×òFR&W66FRÆÖ—FBâ22rrp¢Ð ¢V%ó"Ò°¢wF—GVÆòs¢t—6ÆÖ–VçFòL:—&Ö–6ò’<;§7F–6ó¢¶–fÆW‚g2&ÖfÆW‚’G'V6÷2FR–ç7FÆ6œ;6ârÀ¢w6ÇVrs¢v—6ÆÖ–VçFòÖ¶–fÆW‚Ö&ÖfÆW‚×G'V6÷2Ö–ç7FÆ6–öârÀ¢v6FVv÷&–s¢6G5öF–7BævWB‚v'&–6öÆ¦RÖ6×W&—¦6–öâr’À¢vWF÷"s¢FÖ–å÷W6W"À¢vW5öwV–ööf–6–Âs¢G'VRÀ¢vFW7F6Fòs¢fÇ6RÀ¢vW7FFòs¢v&ö&FòrÀ¢w&W7VÖVâs¢t—6Æ"6÷'&V7FÖVçFRVægW&vöæWFWf—FÆ6öæFVç66œ;6â’VÂ;7†–Fò–çFW&–÷"âW‡Æ–6Ö÷2\:’W7W6÷"WF–Æ—¦"ƒÖÒg2#ÖÒ’Â<;6ÖòÆ–×–"Æ6†’<;6ÖòWf—F"VVçFW2L:—&Ö–6÷2ârÀ¢wf–FVõ÷W&Âs¢v‡GG3¢ò÷wwrç–÷WGV&Ræ6öÒ÷vF6ƒ÷cÕô–Ä§¶–fÇ‚rÀ¢vVæÆ6UöW‡FW&æòs¢v‡GG3¢ò÷wwrævöövÆRæ6öÒ÷6V&6ƒ÷Ö¶–fÆW‚³#ÖÒrÀ¢vVæÆ6UöW‡FW&æõ÷FW‡Fòs¢tFöæFR6ö×&"¶–fÆW‚÷&–v–æÂrÀ¢v6öçFVæ–Fòs¢rrr22VÂ&–W6vòFRÆ6öæFVç66œ;6âVâgW&vòÆWfVÂÖVF—VÐ¥÷"6FW'6öæVRGVW&ÖRVâVægW&vöæWF6RW‡—&âVçG&RãR’Æ—G&òFRf÷"FRwV÷"æö6†Râ6’Æ6†W7L:V×VÆ÷FÂW6Rf÷"6öæFVç6Vâv÷F2’&¦÷"Æ÷2æW'f–÷2Â6W6æFò;7†–Fò–çf—6–&ÆRà ¢ÒÒÐ £22¶–fÆW‚÷&–v–æÂ†VÆ7L;6ÖW&òWFöF†W6—fò£â¤6öÆö66œ;6âFR#ÖÓ¢¢W6W7W6÷"FR#ÖÒVâÆ2&VFW2×Æ–2’FV6†òà£"â¤6öÆö66œ;6âFRÖÒòVÖÓ¢¢×V6†òÜ:2ÖÆV&ÆR&7V'&—"æW'f–÷2’f–v2FöæFRVÂ#ÖÒ6RFW7Vv,:Öà£2â¤Æ6ö†öÂ—6÷&÷:ÖÆ–6ó¢¢–×W&Föæ&ÆRâFV&W2FW6Væw&6"Æ6†6öâ—6÷&÷:ÖÆ–6òçFW2FRVv"â6’Vv26ö'&RöÇfòò6†g,:ÖÂ6R6W,:VâfW&æò÷"VÂ6Æ÷"ârrp¢Ð ¢V%ó2Ò°¢wF—GVÆòs¢u6÷÷'FR’W7F–ÆÆòFR6–W'&RFRfVçFæFöÖWF–2ò6V—G¢Vâ4B‚å5DÂ’rÀ¢w6ÇVrs¢w6÷÷'FR×W7F–ÆÆò×fVçFæÖFöÖWF–2×7FÂrÀ¢v6FVv÷&–s¢6G5öF–7BævWB‚w–W¦2Ó6B×7FÂr’À¢vWF÷"s¢W‡Æ÷&F÷%÷W6W"À¢vW5öwV–ööf–6–Âs¢fÇ6RÀ¢vFW7F6Fòs¢G'VRÀ¢vW7FFòs¢v&ö&FòrÀ¢w&W7VÖVâs¢u–W¦FR&V6Ö&–ò&Vf÷'¦F&Wf—F"v"C^(*Â÷"VÂ6–W'&R6ö×ÆWFò7VæFò6R&ö×RÆW7F;FRÆ:7F–6òâ&6†—fòå5DÂÆ—7Fò&–×&–Ö—"VâUDrò%2ârÀ¢v&6†—fõöFW66&v&ÆRs¢7FÅöf–ÆRÀ¢v6öçFVæ–Fòs¢rrr228'&WF—FR÷"VÂ6öÃò–×&–ÖRVÂGW–ò&Vf÷'¦Fð¤VâfW&æòÂVÂ6Æ÷"7V×VÆFòVâÆfVçFæFRÆWFö6&fæ’VÂW6ò&WWF–Fò7VVÆVâ&ö×W"VÂW7F–ÆÆò÷&–v–æÂFRfÌ:7F–6ò–ç–V7FFòà ¢ÒÒÐ £22,:ÖWG&÷2FRÆÖ–æ6œ;6â&V6öÖVæFF÷3 ¢ÒÖFW&–Ã¢¢¥UDrò%2¢ ¢¢çVæ6W6W2Ä÷'VR6RFVf÷&Ö,:Ü:2FRS+2FVçG&òFVÂfVŒ:Ö7VÆòà¢Ò&VÆÆVæó¢CR–æf–ÆÂv—&ö–FR&Ü:†–Ö&W6—7FVæ6–à¢ÒW,;ÖWG&÷3¢B&VFW2W‡FW&–÷&W2à¢ÒÇGW&FR6¢ã"ÖÒà ¢ÒÒÐ ¤FW66&vVÂå5DÂ6öâVÂ&÷L;6âFR&¦ò’6öÜ:'FVÆò6öâ÷G&÷26×W'2ârrp¢Ð ¢V%óBÒ°¢wF—GVÆòs¢t–ç7FÆ6œ;6âFR&FW,:ÖÆ”fUóB6öâ&VwVÆF÷"6öÆ"ÕB’&VÌ:’7—&—‚rÀ¢w6ÇVrs¢v–ç7FÆ6–öâÖ&FW&–ÖÆ–fWóBÖ×BÖ7—&—‚rÀ¢v6FVv÷&–s¢6G5öF–7BævWB‚vVÆV7G&–6–FB×6öÆ"r’À¢vWF÷"s¢FÖ–å÷W6W"À¢vW5öwV–ööf–6–Âs¢G'VRÀ¢vFW7F6Fòs¢fÇ6RÀ¢vW7FFòs¢v&ö&FòrÀ¢w&W7VÖVâs¢tW7VVÖ6ò6ò&6"FRtÒÆ—F–òÆ”fUóC¢F–ÖVç6–öæÖ–VçFòFRgW6–&ÆW2ÖVvôÖ–F’Â<:Æ7VÆòFR6V66œ;6âFR6&ÆR6V|;¦â×W&¦R’6öæf–wW&6œ;6âFVÂ&VwVÆF÷"6öÆ"f–7G&öâÕBârÀ¢v6öçFVæ–Fòs¢rrr22Æ2fVçF¦2FVÂÆ—F–òVâÆf–Fì;6ÖF§Væ&FW,:ÖFRÆ—F–òÆ”fUóBW&Ö—FRFW66&v"†7FVÂ“R6–âF;'6RÂg&VçFRÂSRFRÆ2tÒõe$ÄG&F–6–öæÆW2âFVÜ:2ÂW6VâsRÖVæ÷2à ¢ÒÒÐ £226V66œ;6âFR6&ÆR’gW6–&ÆW27,:×F–6÷0£â¤6&ÆRFRÇF6V66œ;6ã¢¢&6öæW†œ;6âVçG&R&FW,:Ö’–çfW'6÷"FR#rÂW6Ü:Öæ–Öò3VÖÜ+"òSÖÜ+"à£"â¤gW6–&ÆRÔTt¢6öÆö6VÂgW6–&ÆRÔTtFRÜ:†–Öò#6ÒFVÂ&÷&æR÷6—F—fòFRÆ&FW,:ÖW†–Æ–"à£2â¥&VwVÆF÷"ÕC¢¢6öæf–wW&VÂW&f–ÂFR6&vVâGR&ÇVWFö÷F‚6öâföÇF¦RFR'6÷&6œ;6âBãEb’fÆ÷F6œ;6â2ãUb&æòFVw&F"Æ26VÆF2ârrp¢Ð ¢V%÷VæF–VçFRÒ°¢wF—GVÆòs¢tÖW6ÆVv&ÆRFR÷'L;6âG&6W&ò6öâ7VW&F2ì:WF–62„Vâ&Wf—6œ;6â’rÀ¢w6ÇVrs¢vÖW6×ÆVv&ÆR×÷'Föâ×G&6W&ò×&Wf—6–öârÀ¢v6FVv÷&–s¢6G5öF–7BævWB‚v'&–6öÆ¦RÖ6×W&—¦6–öâr’À¢vWF÷"s¢W‡Æ÷&F÷%÷W6W"À¢vW5öwV–ööf–6–Âs¢fÇ6RÀ¢vFW7F6Fòs¢fÇ6RÀ¢vW7FFòs¢wVæF–VçFRrÀ¢w&W7VÖVâs¢t'&–6ò6ò6ò&ÖöçF"VæÖW6W†–Æ–"FRÖFW&VâVÂ÷'L;6âG&6W&òW6æFò7VW&Fì:WF–6’&—6w&2–çf—6–&ÆW2ârÀ¢v6öçFVæ–Fòs¢rrr229¥WF–Â&6ö6–æ"gVW&¤ÖöçF"VæF&ÆFR&VGVÂf–æÆæL:—2FRVÖÒ6öâF÷2&—6w&2FR–æ÷‚VâVÂæVÂ–çFW&–÷"FVÂ÷'L;6ââ6VwW&F6öâF÷27VW&F2ì:WF–62FRFÖÒVR6÷÷'Fâ†7F#V¶râW&fV7Fò&öæW"Æ6ö6–æ—FFRv26×–æv—FW¢ârrp¢Ð ¢f÷"öFF–â·V%óÂV%ó"ÂV%ó2ÂV%óBÂV%÷VæF–VçFUÓ ¢V"Â7&VFVBÒV&Æ–66–öåFÆÆW"æö&¦V7G2ævWEö÷%ö7&VFR€¢6ÇVs×öFF²vöÖ'&RuÒÀ¢FVfVÇG3×öFF¢¢–b7&VFVC ¢&–çB†b%÷7B7&VFó¢·V"çF—GVÆ÷Ò"¢–bV"æW7FFòÓÒwVæF–VçFRræBFÖ–å÷W6W# ¢æ÷F–f–66–öâæö&¦V7G2æ7&VFR€¢W7V&–õöFW7F–æóÖFÖ–å÷W6W"À¢W7V&–õö÷&–vVãÖW‡Æ÷&F÷%÷W6W"À¢F—óÒw6—7FVÖrÀ¢F—GVÆóÒ|9fÞûÈBçVWfV&Æ–66œ;6âVæF–VçFRVâFÆÆW"6×Æ–æ²rÀ¢ÖVç6¦SÖe÷¶W‡Æ÷&F÷%÷W6W"çW6W&æÖWÒ†&VF7FFò'·V"çF—GVÆ÷Ò"â&Wf—6Æ’'VV&ÆârÀ¢VæÆ6SÖbr÷FÆÆW#÷&Wf—6–öã×·V"æ–GÒp¢ ¢&–çB‚,*FÆÆW"6×Æ–æ²ö&ÆFòW†—F÷6ÖVçFR" ¦–bõöæÖUõòÓÒuõöÖ–åõòs ¢ö&Æ"‚