# MotorTour – Guida all'installazione

## Struttura del progetto

```
MotorTour/
├── motortour-plugin/        ← Plugin WordPress (backend)
└── motortour-frontend/      ← App React (frontend)
```

---

## 1. Installazione plugin WordPress (LocalWP)

1. Apri **LocalWP** e crea un nuovo sito (es. `motortour.local`)
2. Copia la cartella `motortour-plugin/` in:
   ```
   [LocalWP sites path]/motortour/app/public/wp-content/plugins/
   ```
3. Vai in **WordPress Admin → Plugin** e attiva **MotorTour**
4. Il plugin creerà automaticamente la pagina `/portale-tour` con lo shortcode `[motortour_app]`

---

## 2. Compilare il frontend React

Prerequisiti: **Node.js 18+** installato.

```bash
cd motortour-frontend
npm install
npm run build
```

Il build compila tutto in `motortour-plugin/assets/frontend/` — WordPress lo carica automaticamente.

### Sviluppo con hot reload

```bash
npm run dev
```

Il dev server gira su `http://localhost:5173` e fa da proxy verso `http://motortour.local`.  
Per visualizzare React in sviluppo, apri direttamente `localhost:5173` oppure configura il proxy in `vite.config.js` con l'URL corretto del tuo sito LocalWP.

---

## 3. Primo avvio in WordPress

Dopo l'attivazione del plugin:

1. Vai su **MotorTour → Tour** e crea un nuovo tour
2. Compila: titolo, data, punto di raduno, imposta stato su **"Iscrizioni aperte"**
3. Vai sulla pagina `/portale-tour` del sito — vedrai la lista tour
4. Clicca "Iscriviti" per testare il form completo

---

## 4. Workflow iscrizione (test)

1. Compila il form come utente → invia
2. Vai in **MotorTour → Dashboard** nel backend WP
3. Vedrai l'iscrizione in stato *In attesa*
4. Clicca **Approva** → l'utente riceve email con link accesso
5. Testa il login con email+password dell'iscrizione

---

## 5. Configurazione email (LocalWP)

Per testare le email in locale installa il plugin **WP Mail SMTP** e configura:
- Driver: **Mailtrap** (gratuito per test) o **Gmail** con App Password
- Oppure usa il plugin **WP Mail Catcher** per catturare le email localmente

---

## 6. Prossimi step da sviluppare

- [ ] Pagina TourDetail con mappa integrata (Leaflet.js)
- [ ] Admin UI per tappe e POI con drag & drop riordinamento
- [ ] Sistema di notifiche push (opzionale)
- [ ] Export iscrizioni in PDF/Excel
- [ ] Temi visivi per-tour più avanzati
