import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { Provider } from "react-redux";
import { store, persistor } from "./store/index";
import { PersistGate } from "redux-persist/integration/react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}> {/*새로고침 시 데이터 유지*/}
        <Router>
          <App />
        </Router>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
