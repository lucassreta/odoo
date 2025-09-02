/** @odoo-module **/

import { registry } from "@web/core/registry";

console.log('🚀 Iniciando Google Places Autocomplete para Odoo 17');

// Configuración
const GOOGLE_API_KEY = 'AIzaSyBDWwJnH9I4Y82tD2UCyOJztpLdKabFRik';
let googleApiLoaded = false;
let autocompleteInstances = new Map();
let observer = null;

// Función para cargar la API de Google Places
async function loadGooglePlacesAPI() {
    if (typeof window.google !== 'undefined' && 
        window.google.maps && 
        window.google.maps.places) {
        console.log('✅ Google Places API ya disponible');
        return true;
    }

    // Verificar si ya existe un script cargándose
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.log('📍 Script de Google ya existe, esperando...');
        return new Promise((resolve) => {
            const checkLoaded = () => {
                if (typeof window.google !== 'undefined' && 
                    window.google.maps && 
                    window.google.maps.places) {
                    resolve(true);
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
        });
    }

    return new Promise((resolve) => {
        console.log('🔄 Cargando Google Places API...');
        
        const callbackName = 'initGooglePlaces' + Date.now();
        window[callbackName] = () => {
            console.log('✅ Google Places API cargada exitosamente');
            googleApiLoaded = true;
            delete window[callbackName];
            resolve(true);
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&callback=${callbackName}`;
        script.async = true;
        script.defer = true;
        
        script.onerror = () => {
            console.error('❌ Error cargando Google Places API');
            delete window[callbackName];
            resolve(false);
        };
        
        document.head.appendChild(script);
    });
}

// Función para configurar autocompletado en un campo
async function setupGooglePlacesField(input) {
    if (!input || autocompleteInstances.has(input)) {
        return;
    }

    console.log('🔧 Configurando autocompletado para campo:', input);

    try {
        // Cargar API si es necesario
        const apiLoaded = await loadGooglePlacesAPI();
        if (!apiLoaded) {
            console.warn('⚠️ No se pudo cargar Google Places API');
            input.placeholder = "Ingrese dirección manualmente";
            return;
        }

        // Crear instancia de autocompletado
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
            types: ['address'],
            fields: ['place_id', 'formatted_address', 'address_components', 'geometry']
        });

        // Opcional: Restringir a un país específico (ej: Argentina)
        autocomplete.setComponentRestrictions({'country': ['ar']});

        // Manejar selección de lugar
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            console.log('📍 Lugar seleccionado:', place);
            
            if (place && place.formatted_address) {
                input.value = place.formatted_address;
                
                // Disparar eventos para que Odoo detecte el cambio
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('blur', { bubbles: true }));
                
                console.log('✅ Dirección actualizada:', place.formatted_address);
            } else {
                console.warn('⚠️ No se pudo obtener la dirección del lugar seleccionado');
            }
        });

        // Personalizar el campo
        input.placeholder = "🌍 Buscar dirección...";
        input.style.minWidth = "350px";
        
        // Guardar instancia
        autocompleteInstances.set(input, autocomplete);
        
        console.log('✅ Autocompletado configurado exitosamente');
        
    } catch (error) {
        console.error('❌ Error configurando autocompletado:', error);
        input.placeholder = "Error - ingrese dirección manualmente";
    }
}

// Función para buscar e inicializar campos
function initializeGooglePlacesFields() {
    console.log('🔍 Buscando campos de autocompletado...');
    
    // Verificar que document esté disponible
    if (!document || !document.querySelectorAll) {
        console.warn('⚠️ Document no disponible aún');
        return;
    }
    
    // Buscar campos por nombre
    const fieldsByName = document.querySelectorAll('input[name="x_address_autocomplete"]');
    console.log(`📍 Encontrados ${fieldsByName.length} campos por nombre`);
    
    fieldsByName.forEach(field => {
        if (!autocompleteInstances.has(field)) {
            setupGooglePlacesField(field);
        }
    });

    // Buscar campos por clase CSS
    const fieldsByClass = document.querySelectorAll('.o_google_places_field input');
    console.log(`📍 Encontrados ${fieldsByClass.length} campos por clase`);
    
    fieldsByClass.forEach(field => {
        if (!autocompleteInstances.has(field)) {
            setupGooglePlacesField(field);
        }
    });

    // Buscar en formularios de sale.order específicamente
    const saleOrderFields = document.querySelectorAll('.o_form_view input[name="x_address_autocomplete"]');
    console.log(`📍 Encontrados ${saleOrderFields.length} campos en sale.order`);
    
    saleOrderFields.forEach(field => {
        if (!autocompleteInstances.has(field)) {
            setupGooglePlacesField(field);
        }
    });
}

// Función para inicializar el observer de manera segura
function setupDOMObserver() {
    if (observer) {
        return; // Ya configurado
    }

    // Verificar que document.body esté disponible
    if (!document.body) {
        console.log('📄 Body no disponible, esperando...');
        setTimeout(setupDOMObserver, 500);
        return;
    }

    try {
        // Observer para detectar cambios dinámicos en el DOM (navegación de Odoo)
        observer = new MutationObserver((mutations) => {
            let shouldReinit = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Verificar si se agregaron campos relevantes
                            if (node.querySelector && (
                                node.querySelector('input[name="x_address_autocomplete"]') ||
                                node.querySelector('.o_google_places_field input') ||
                                node.matches && node.matches('input[name="x_address_autocomplete"]') ||
                                node.matches && node.matches('.o_google_places_field input')
                            )) {
                                shouldReinit = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldReinit) {
                console.log('🔄 Nuevos campos detectados, reinicializando...');
                setTimeout(initializeGooglePlacesFields, 500);
            }
        });

        // Observar cambios en el body
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('✅ Observer configurado correctamente');
        
    } catch (error) {
        console.error('❌ Error configurando observer:', error);
        observer = null;
    }
}

// Función principal de inicialización
function initializeModule() {
    console.log('📄 Inicializando módulo Google Places...');
    
    // Inicializar campos existentes
    setTimeout(initializeGooglePlacesFields, 1000);
    
    // Configurar observer
    setTimeout(setupDOMObserver, 1500);
    
    // Verificación periódica para campos no inicializados
    setInterval(() => {
        if (!document || !document.querySelectorAll) return;
        
        const uninitializedFields = document.querySelectorAll('input[name="x_address_autocomplete"]');
        let needsInit = false;
        
        uninitializedFields.forEach(field => {
            if (!autocompleteInstances.has(field)) {
                needsInit = true;
            }
        });
        
        if (needsInit) {
            console.log('🔄 Campos sin inicializar detectados, reinicializando...');
            initializeGooglePlacesFields();
        }
    }, 5000);

    // Limpiar instancias cuando los elementos son removidos del DOM
    setInterval(() => {
        if (!document || !document.contains) return;
        
        const toRemove = [];
        autocompleteInstances.forEach((autocomplete, input) => {
            if (!document.contains(input)) {
                toRemove.push(input);
            }
        });
        
        toRemove.forEach(input => {
            autocompleteInstances.delete(input);
            console.log('🧹 Instancia de autocompletado limpiada');
        });
    }, 10000);
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModule);
} else {
    // DOM ya está listo
    initializeModule();
}

console.log('✅ Google Places Autocomplete para Odoo 17 cargado completamente');
