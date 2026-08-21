# LORFAB PHOTOS — Portfolio Fotografico 3D & World Archive

> Portfolio fotografico personale di **Fabrizio Lorenzetti** ([lorfabphotos.com](https://lorfabphotos.com/)).  
> Sito completamente statico a **costo 0 €**, ospitato su **GitHub Pages**, con automazione CI/CD tramite **GitHub Actions** e mappamondo 3D interattivo in **WebGL** (Globe.gl / Three.js).

---

## ✨ Caratteristiche Principali

- 🌍 **Globo 3D WebGL Interattivo**: Navigazione tridimensionale sferica, rotazione continua lenta con pausa automatica all'interazione, zoom, drag touch/mouse e animazione fluida di puntamento camera (*fly-to*).
- 🏷️ **Marker Dinamici**: Generati automaticamente dai dati geografici in `viaggi.json`.
- ⚡ **Zero Manutenzione Manuale delle Foto**: Nessun elenco di immagini da scrivere a mano nei file JSON. Le fotografie inserite nelle cartelle vengono rilevate, ordinate e indicizzate automaticamente durante il deploy.
- 🖼️ **Galleria Editoriale Asimmetrica**: Griglia fotografica in stile magazine contemporaneo, layout responsive, lazy loading nativo e copertina del viaggio calcolata automaticamente dalla prima foto disponibile.
- 🔍 **Lightbox Completo**: Visualizzatore ad alta risoluzione con navigazione a tastiera (`←`, `→`, `ESC`), pulsanti touch e gesture di swipe su smartphone.
- 📖 **Pagina Biografia**: Layout editoriale coordinato per la poetica visiva, contatti e dichiarazione d'autore (`bio.html`).
- 💸 **Costo 0 € e Zero Dipendenze a Pagamento**: Nessun backend, nessun database, nessuna API key a pagamento, nessun costo di hosting o abbonamento.

---

## 📁 Struttura del Progetto

```text
lorfabphotos/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions per build del manifest e deploy su GitHub Pages
├── scripts/
│   ├── generate-manifest.js       # Script Node.js di scansione automatica (eseguito in GitHub Actions)
│   └── generate-manifest.py       # Script Python equivalente (per test/generazione locale)
├── viaggi/
│   ├── uzbekistan/                 # Cartella viaggio (ID: uzbekistan)
│   │   ├── 001.jpg
│   │   ├── 002.jpg
│   │   └── ...
│   ├── bosnia/                     # Cartella viaggio (ID: bosnia)
│   │   ├── 001.jpg
│   │   └── ...
│   └── armenia/                    # Cartella viaggio (ID: armenia)
│       ├── 001.jpg
│       └── ...
├── index.html                      # Homepage con Globo 3D, overlay info, galleria e lightbox
├── bio.html                        # Pagina biografia del fotografo
├── style.css                       # Design system scuro, minimale ed editoriale
├── script.js                       # Logica WebGL, gestione dati, galleria e lightbox
├── viaggi.json                     # Metadati descrittivi dei luoghi (coordinate, titoli, storie)
├── manifest.json                   # File generato automaticamente con l'elenco delle fotografie
├── CNAME                           # Dominio personalizzato per GitHub Pages (lorfabphotos.com)
├── package.json                    # Script npm per build e server locale
└── README.md                       # Documentazione del progetto
```

---

## 🚀 Workflow Quotidiano

### 1. Aggiungere Nuove Fotografie a un Viaggio Esistente
Non devi modificare alcun file di codice né alcun JSON.

1. Copia le tue nuove immagini nella cartella del viaggio corrispondente, ad esempio:
   ```text
   viaggi/uzbekistan/006.jpg
   viaggi/uzbekistan/007.jpg
   ```
2. Esegui il commit e il push su GitHub:
   ```bash
   git add .
   git commit -m "Aggiunte nuove fotografie Uzbekistan"
   git push
   ```
3. **GitHub Actions farà tutto da solo**:
   - Scansionerà la cartella `viaggi/`.
   - Genererà automaticamente il nuovo `manifest.json`.
   - Pubblicherà il sito aggiornato su `https://lorfabphotos.com`.

---

### 2. Aggiungere un Nuovo Viaggio
1. Crea una nuova cartella dentro `viaggi/` con il nome identificativo (ID) in minuscolo (es. `georgia`):
   ```text
   viaggi/georgia/
     ├── 001.jpg
     ├── 002.jpg
     └── 003.jpg
   ```
2. Apri `viaggi.json` e aggiungi il blocco per il nuovo luogo:
   ```json
   {
     "id": "georgia",
     "titolo": "Georgia",
     "sottotitolo": "Torri difensive e valli del Caucaso",
     "lat": 41.7151,
     "lng": 44.8271,
     "anno": 2025,
     "storia": "Breve frase riassuntiva che compare nella card di anteprima sul mappamondo.",
     "articolo": [
       "Primo paragrafo dell'articolo dedicato alla storia, atmosfera e contesto del viaggio.",
       "Secondo paragrafo dedicato alle particolarità architettoniche, alla luce e all'esperienza visiva.",
       "Terzo paragrafo con riflessioni e sensazioni dietro la lente."
     ],
     "peculiarita": [
       "Torri Medievali di Svaneti",
       "Modernismo Georgiano",
       "Luce di Montagna"
     ]
   }
   ```
3. Esegui il commit e push:
   ```bash
   git add .
   git commit -m "Aggiunto viaggio in Georgia con foto e articolo"
   git push
   ```
4. Il nuovo marker apparirà automaticamente sul globo 3D, con l'articolo editoriale formattato, i tag delle peculiarità, il conteggio calcolato e la galleria navigabile.

---

## 🌐 Configurazione Dominio Personalizzato (`lorfabphotos.com`)

Il progetto include già il file `CNAME` con il valore `lorfabphotos.com`.

### Configurazione DNS (sul tuo Registrar di dominio)
Per collegare `lorfabphotos.com` a GitHub Pages, accedi al pannello di gestione DNS del tuo fornitore di dominio e imposta:

1. **Record A** (per il dominio root `lorfabphotos.com`):
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`

2. **Record CNAME** (per il sottodominio `www.lorfabphotos.com`):
   - Nome: `www`
   - Valore: `<tuo-username-github>.github.io`

### Attivazione HTTPS su GitHub Pages
1. Nel tuo repository su GitHub, vai su **Settings** > **Pages**.
2. Sotto **Build and deployment**, seleziona **GitHub Actions** come Source.
3. Sotto **Custom domain**, verifica che sia presente `lorfabphotos.com`.
4. Spunta la casella **Enforce HTTPS** (la generazione del certificato SSL gratuito Let's Encrypt richiederà pochi minuti).

---

## 💻 Test in Locale

I browser moderni bloccano le richieste `fetch()` asincrone verso file JSON quando la pagina viene aperta con doppio clic (`file://`). Per visualizzare il sito correttamente in locale con tutti i dati:

### Opzione A: Con Python (già installato)
```bash
python -m http.server 8000
```
Apri il browser su `http://localhost:8000`.

### Opzione B: Con Node.js / npx
```bash
npx serve .
```

### Generare il manifest in locale:
- Tramite Node.js:
  ```bash
  node scripts/generate-manifest.js
  ```
- Oppure tramite Python:
  ```bash
  python scripts/generate-manifest.py
  ```

---

## 📜 Licenze e Risorse Open Source

- **Globe.gl**: [MIT License](https://github.com/vasturiano/globe.gl) — Visualizzazione WebGL sferica 3D interattiva.
- **Three.js**: [MIT License](https://github.com/mrdoob/three.js) — Motore grafico 3D open source.
- **Earth Textures**: Texture satellitari notturne e topografiche fornite dalla NASA / Visible Earth (Pubblico Dominio).
- **Tipografia**: Google Fonts (*Plus Jakarta Sans* e *Syne* sotto licenza SIL Open Font License).
