//var OCVCInitializerPdftron = window.OCVCInitializerPdftron ? window.OCVCInitializerPdftron : {};

/**
 * Luego de que el documento esté cargado, inicializar función
 */
var instance_OCVCInitializerPdftron;
document.onreadystatechange = function () {
	if (document.readyState == "complete") {
		instance_OCVCInitializerPdftron = new OCVCInitializerPdftron();
		instance_OCVCInitializerPdftron.initLoad('container_pfdtron');
		
		// Archivo JS de soporte
		try{
			setTimeout(function(){
				var _iframe = document.getElementById("container_pfdtron").getElementsByTagName("iframe")[0].contentWindow.document;   
				var iFrameHead = _iframe.getElementsByTagName("head")[0];         
				var myscript = document.createElement('script');
				myscript.type = 'text/javascript';
				myscript.src = '../../js_support.js';
				iFrameHead.appendChild(myscript);
			}, 500);
		}catch(err){
			console.log(err);
		}
	}
	
	// Ajuste ELECTRON - Deshabilitar herramientas en estado Offline
	try{
		if(navigator.userAgent.toLowerCase().indexOf('electron/') > -1){
			window.addEventListener('online', function(){
				try{
					instance_OCVCInitializerPdftron.toggleStatusOnLineActions();	
				}catch(e){}
			});			
			window.addEventListener('offline', function(){
				try{
					instance_OCVCInitializerPdftron.toggleStatusOnLineActions();				
				}catch(e){}
			});
		}
	}catch(e){}
	
}

/**
 * Inicialización y funciones para PDFTron
 */
var OCVCInitializerPdftron = function(){
	
	var time_detectLoadPdfTronLib;
	var containerDivLoadPdfTron;
	var instancePdfTron;
	var docViewer;
			
	var annotManager;
	var PATH_ROOT;
	var USER_NAME = '';
	var USER_ID = '';
	var USER_ROLE = 'student';
	var MAGENTA_ENABLED = false;
	var IS_FINISHEDRENDERING = false;
	var LANG_LIBRARY;
	var THEME = null;
	var SHOW_AT = null;
	var onAddAnnotation = null;
	var onUpdateAnnotation = null;
	var onDeleteAnnotation = null;
	var showError = null;
	var getContentHotspot = null;
	var initSesionConsumption = null;
	var finishSesionConsumption = null;
	var reportTraceConsumption = null;
	var EXTRADATA = null;
	
	var CALLBACK_LOAD = null;
	var DOC_IS_LOAD = false;
	var GLOBAL_ANNOTATIONS;
	var GLOBAL_FILE;
	var FILE_COOKIES = null;
	var IS_LOADED_LANG = false;
	
	var myAuthorMap = {};
	
	console.log('[LIB INITIALIZER PDFTRON v0.0.23 - 11_02_2020]')
	
	// Iniciando carga de librería
	this.initLoad = function(_container){
		containerDivLoadPdfTron = _container;
		time_detectLoadPdfTronLib = setInterval(detectLoadPdfTron(), 100);
	}
	
	// Iniciando carga de librería
	this.ISshowError = function(_msj){
		showError(_msj);
	}
	
	this.selectAnnotation = function(id_annotation){
		var annotations = annotManager.getAnnotationsList();		
		annotations.forEach(function(annot) {
			if(annot.Id == id_annotation){
				annotManager.selectAnnotation(annot);
				docViewer.setCurrentPage(annot.PageNumber);	
			}
		});
	}
	
	this.toggleStatusOnLineActions = function(){
		if( navigator.onLine ){			
			try{				
				if(navigator.userAgent.toLowerCase().indexOf('electron/') > -1){					
					instancePdfTron.enableElements([ 'textToolGroupButton', 'shapeToolGroupButton', 'freeHandToolGroupButton', 'textPopup', 'annotationPopup', 'contextMenuPopup', 'notesPanel' ]);
				}
			}catch(e){}			
		}else{
			try{			
				if(navigator.userAgent.toLowerCase().indexOf('electron/') > -1){					
					instancePdfTron.disableElements([ 'textToolGroupButton', 'shapeToolGroupButton', 'freeHandToolGroupButton', 'textPopup', 'annotationPopup', 'contextMenuPopup', 'notesPanel' ]);
				}
			}catch(e){}			
		}
	}
	
	// Carga de archivo
	this.loadFile = function(
		_file, 
		_file_cookies,
		_show_at, 
		_user_name, 
		_user_id, 
		_user_role, 
		_langs, 
		_theme, 
		_annotations, 
		report_onAddAnnotation, 
		report_onUpdateAnnotation, 
		report_onDeleteAnnotation, 
		report_showError,
		report_getContentHotspot,
		report_initSesionConsumption,
		report_finishSesionConsumption,
		report_reportTraceConsumption,
		_callback,
		_extraData
	){
		
		if( _file.indexOf('index.html') >= 0 ){
			_file = _file.replace('index.html', 'book_i2c.pdf');
		}
		_file = _file.replace('http://localhost:8080/@', '');
		
		//_file = _file.replace('%2F', '/');
		
		DOC_IS_LOAD = false;
		GLOBAL_ANNOTATIONS = _annotations
		GLOBAL_FILE = _file
		IS_FINISHEDRENDERING = false;
		
		// FUNCIONES
		CALLBACK_LOAD = _callback;
		onAddAnnotation = report_onAddAnnotation;
		onUpdateAnnotation = report_onUpdateAnnotation;
		onDeleteAnnotation = report_onDeleteAnnotation;
		showError = report_showError;
		getContentHotspot = report_getContentHotspot;
		initSesionConsumption = report_initSesionConsumption;
		finishSesionConsumption = report_finishSesionConsumption;
		reportTraceConsumption = report_reportTraceConsumption;

		PATH_ROOT = (GLOBAL_FILE.replace( GLOBAL_FILE.split('/')[ (GLOBAL_FILE.split('/').length - 1) ] , ''));
		USER_ID = _user_id || USER_ID;
		USER_NAME = _user_name || USER_NAME;
		USER_ROLE = _user_role || USER_ROLE;
		LANG_LIBRARY = _langs || LANG_LIBRARY;
		
		console.log('===============================')
		console.log(LANG_LIBRARY)
		
		try{ EXTRADATA = _extraData; }catch(e){}
		
		THEME = _theme || '';
		SHOW_AT = _show_at || '';
		FILE_COOKIES = _file_cookies || [];
		
		let xmlDoc;
		let xmlDocPage;
		let have_2f = '';
		
		if( USER_ROLE == 'teacher' ){			
			if( GLOBAL_FILE.indexOf('%2F') >= 0 ){
				PATH_ROOT = GLOBAL_FILE.split('%2F')[0];
			}			
		}
		
		var teacher_file_extencion = ( GLOBAL_FILE.split('.')[ (GLOBAL_FILE.split('.').length - 1) ] );
		var teacher_file = PATH_ROOT + 'teacher.' + teacher_file_extencion;		
		
		if( GLOBAL_FILE.indexOf('%2F') >= 0 ){
			teacher_file = PATH_ROOT + '%2Fteacher.' + teacher_file_extencion;
		}
		
		var options = { withCredentials: true, useDownloader: true };

		if( USER_ROLE == 'teacher' ){
			console.log('( LOADING: '+teacher_file+' )');	
			try{ document.getElementById('console__black').innerHTML += '<p>teacher_file: '+teacher_file+'</p>'; }catch(e){}				
		}else{
			try{ document.getElementById('console__black').innerHTML += '<p>GLOBAL_FILE: '+GLOBAL_FILE+'</p>'; }catch(e){}				
			console.log('( LOADING: '+GLOBAL_FILE+' )');			
		}
		
		// ENABLE DISABLE PRINT AND DOWNLOAD
		instancePdfTron.disableElements([ 'printButtonCustom', 'downloadButtonCustom' ]);
		try{			
			if( EXTRADATA.isOwner === true){
				instancePdfTron.enableElements([ 'printButtonCustom', 'downloadButtonCustom' ]);
			}			
		}catch(e){}
		// ENABLE DISABLE PRINT AND DOWNLOAD

		// Leer archivos
		if( USER_ROLE == 'teacher' ){
			
			var xhr = new XMLHttpRequest();
			xhr.open('HEAD', teacher_file, true);
			xhr.withCredentials = true;
			xhr.onload = function(e) {				
				if (this.status === 200) {

					try{ document.getElementById('console__black').innerHTML += '<p>teacher_file: '+teacher_file+'</p>'; }catch(e){}

					instancePdfTron.loadDocument(teacher_file, options);
					if(teacher_file_extencion == 'pdf'){
						//MAGENTA_ENABLED = true;
					}

				}else{

					try{ document.getElementById('console__black').innerHTML += '<p>NOT FOUND: '+teacher_file+'</p>'; }catch(e){}
					try{ document.getElementById('console__black').innerHTML += '<p>LOADING GLOBAL_FILE: '+GLOBAL_FILE+'</p>'; }catch(e){}
					console.log('( NOT FOUND: '+teacher_file+' )');					
					console.log('( LOADING: '+GLOBAL_FILE+' )');
					
					instancePdfTron.loadDocument(GLOBAL_FILE, options);
				}
			};
			xhr.onerror = function (e) {
				console.log('STATUS ONERROR')
				console.log(this.status)
				console.log(this);

				console.log('( NOT FOUND: '+teacher_file+' )');					
				console.log('( LOADING: '+GLOBAL_FILE+' )');

				try{ document.getElementById('console__black').innerHTML += '<p>NOT FOUND: '+teacher_file+'</p>'; }catch(e){}
				try{ document.getElementById('console__black').innerHTML += '<p>LOADING GLOBAL_FILE: '+GLOBAL_FILE+'</p>'; }catch(e){}

				instancePdfTron.loadDocument(GLOBAL_FILE, options);
			};
			xhr.send();
		}else{

			try{ document.getElementById('console__black').innerHTML += '<p>NOT FOUND: '+teacher_file+'</p>'; }catch(e){}
			try{ document.getElementById('console__black').innerHTML += '<p>LOADING GLOBAL_FILE: '+GLOBAL_FILE+'</p>'; }catch(e){}

			instancePdfTron.loadDocument(GLOBAL_FILE, options);
		}
		
		// Setear USUARIO de las ANOTACIONES
		myAuthorMap[USER_ID] = USER_NAME;
		//myAuthorMap = { '1aaa176a-e264-fe0f-b7db-b4bf49562d2e': 'Alice', '6417ea94-0ac0-0891-70b4-0a4b877893a3': 'Bob' }
		annotManager.setCurrentUser(USER_ID);	

		
		// Carga de Lang Externo, si lo hubiera
		if( !IS_LOADED_LANG ){
			IS_LOADED_LANG = true;
			loadExternalLang();
		}
		
		// Set DIV teme
		try{ document.getElementById(containerDivLoadPdfTron).classList.add( THEME ); }catch(e){}

		try{			
			var tab_panel_element = document.getElementById('container_pfdtron').querySelector("iframe").contentWindow.document.querySelector('div[data-element="customPanelTab"]')
			tab_panel_element.parentNode.removeChild(tab_panel_element);	
			var panel_element = document.getElementById('container_pfdtron').querySelector("iframe").contentWindow.document.querySelector('div[data-element="customPanel"]')
			panel_element.parentNode.removeChild(panel_element);	
		}catch(e){
			console.log(e)
		}
	}
	
	// Importando archivo XFDF
	function importAnotarionsPrivate(){
		
		try{
			var xfdfString_array = GLOBAL_ANNOTATIONS
			
			if( !(xfdfString_array.length == 0 || xfdfString_array == '') ){			
				var _all_annotations = '<?xml version="1.0" encoding="UTF-8" ?><xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve"> <annots>';
				for(var a=0; a<xfdfString_array.length; a++){					
					_all_annotations += xfdfString_array[a];
				}
				_all_annotations += '</annots> </xfdf>';				
				
				annotManager.importAnnotations( _all_annotations );
			}
		}catch(e){
			console.log(e);		
			try{ document.getElementById('console__black').innerHTML += '<p>'+e+'</p>'; }catch(e){}			
		}
	}
	
	// Importando archivo XFDF
	function importAnnotationsXFDF(){
		var _file = GLOBAL_FILE.slice(0, -3) + 'xfdf?t=' + new Date().getTime()+'&mode=no-cache';
		//var _file = GLOBAL_FILE.slice(0, -3) + 'xfdf';		
		try{			
			if( _file.indexOf('__orig__book_i2c') ){
				_file = _file.replace('__orig__book_i2c', 'book_i2c');
			}
		}catch(e){}
		
		try{ document.getElementById('console__black').innerHTML += '<p>INTENTARA CARGAR: '+_file+'</p>'; }catch(e){}

		//console.time('loaded-file');
		//var xhr = new XMLHttpRequest();
		//xhr.open('HEAD', _file, true);
		//xhr.onload = function(e) {
		//	if (this.status == 200) {			
				
				// Si existe el archivo, leer.
				
				const xhr_file = new XMLHttpRequest();
				xhr_file.open("GET", _file, true);
				xhr_file.withCredentials = true;
				xhr_file.send();

				//xhr_file.onreadystatechange = (e) => {
				xhr_file.onreadystatechange = function(e) {
					//console.log(xhr)
					if(xhr_file.readyState == 4){						
						if(xhr_file.status == 200){	
							//console.timeEnd('loaded-file');
						
							// Visualizando iconos CAPA MAGENTA
							if( MAGENTA_ENABLED ){
								instancePdfTron.enableElements([ 'showMagentaLayer' ]);								
							}

							var _XFDF = xhr_file.response;
							
							// PARTIAL LOAD
							//let parser = new DOMParser();
							//xmlDoc = parser.parseFromString(_XFDF,"text/xml");							
							//xmlDocPage = xmlDoc.querySelectorAll('stamp[page="10"]');							
							//let xmlStr = '<?xml version="1.0" encoding="UTF-8"?> <xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve"> <annots>';
							//xmlDocPage.forEach(function(e){
							//	xmlStr += e.outerHTML;
							//});
							//xmlStr += '</annots></xfdf>';							
							//console.log(xmlStr)

							// import asynchronously				
							
							//try{ console.time('loaded-anotations'); }catch(e){}
							
							annotManager.importAnnotationsAsync(_XFDF, function(annotations) {
								// console.log(annotations);
								console.log('finished loading XFDF');
								renderItemsInCustomPanel();
							});					
						}else{
							console.log('ERROR AL LEER XFDF...')
						}
					}
				}
		//	}else{
		//		console.log('FILE XFDF NOT EXIST');				
		//	}
		//};
		//xhr.send();
	}
	
	function renderItemsInCustomPanel(){
		
		var _title_hotspot = 'Contenido especial';
		try{ _title_hotspot = LANG_LIBRARY.VISOR_LIB_PDFTRON_CUSTOM_CONTEUDO_ESPECIAL || 'Contenido especial'; }catch(e){ console.log(e); }
		var _pagina_text = 'Página';
		try{ _pagina_text = LANG_LIBRARY.VISOR_LIB_PDFTRON_CONTEUDO_ESPECIAL_PAGE || 'Página'; }catch(e){ console.log(e); }
		
		var myCustomPanel = {
			tab:{
				dataElement: 'customPanelTab',
				title: _title_hotspot,
				img: 'ic_annotation_stamp_black_24px'
			},
			panel: {
				dataElement: 'customPanel',
				render: function() {
					
					var annotations = annotManager.getAnnotationsList();								
					var div = document.createElement('div');
					div.id = 'hotspot_tron_list';								
					var _pnumber = null;
							
					annotations.forEach(function(annot) {
						// (annot.Subject.indexOf('imageLink') >= 0) ||
						if( (annot.Subject.indexOf('htmlLink') >= 0) || (annot.Subject.indexOf('audioLink') >= 0) || (annot.Subject.indexOf('videoLink') >= 0) || (annot.Subject.indexOf('urlLink') >= 0) || (annot.Subject.indexOf('pdfLink') >= 0) ){

							if(_pnumber != annot.PageNumber){
								_pnumber = annot.PageNumber;
								div.innerHTML +='<div class="hotspot_tron_list_item_sep">'+_pagina_text+' '+_pnumber+'</div>';
							}
						
							div.innerHTML +='<div class="hotspot_tron_list_item ht_item_'+annot.Subject+'" onClick="javascript:window.top.instance_OCVCInitializerPdftron.selectAnnotation(\''+annot.Id+'\')">'+
											'	<div class="hotspot_tron_list_item_icon '+THEME+' "></div>'+
											'	<div class="hotspot_tron_list_item_name">'+annot.getContents()+'</div>'+
											'</div>';
						}									
					});

					return div;
				}
			}
		};
		instancePdfTron.setCustomPanel(myCustomPanel);
	}
	
	// Ocultar o Visualizar capas
	function showAndHideLayers(_name, _value){
		const doc = docViewer.getDocument();
		doc.getLayersArray().then(function(layers) {			
			layers.forEach(function(layer, index) {				
				if( layers[index].name == _name ){
					layers[index].visible = _value;	
				}
			});			
			doc.setLayersArray(layers);
			// clears page cache
			docViewer.refreshAll();
			// redraws
			docViewer.updateView();
		});
	}
	
	// Retorna instancia.
	this.getCurrentInstance = function(){
		return instancePdfTron;
	}
	
	// Retorna página actual que se está visualizando.
	this.getCurrentPage = function(){
		return instancePdfTron.getCurrentPageNumber();
	}
	
	// Setea página actual que se está visualizando.
	this.setCurrentPage = function(_page){
		docViewer.setCurrentPage(_page);
	}
	
	// Visualizar.
	this.show = function(){
		document.getElementById( containerDivLoadPdfTron ).classList.remove('ocvc_pdftron_hidden');
	}
	
	// Ocultar.
	this.hide = function(){	
		GLOBAL_FILE = "";
		try{
			IS_FINISHEDRENDERING = false;			
			var _all_annotations = annotManager.getAnnotationsList();	
			//console.log(_all_annotations)
			annotManager.deleteAnnotations(_all_annotations, false , true);
			
		}catch(e){ 
			console.log(e);
			try{ document.getElementById('console__black').innerHTML += '<p>'+e+'</p>'; }catch(e){}
		}
		try{
			instancePdfTron.closeDocument().then(function() {
				console.log('Document is closed!');
				try{ document.getElementById('console__black').innerHTML += '<p>Document is closed!</p>'; }catch(e){}
			});
		}catch(e){ 
			console.log(e);
			try{ document.getElementById('console__black').innerHTML += '<p>'+e+'</p>'; }catch(e){}
		}
		document.getElementById( containerDivLoadPdfTron ).classList.add('ocvc_pdftron_hidden');
	}
	
	function detectLoadPdfTron(){
		if( window.WebViewer ){
			
			clearInterval(time_detectLoadPdfTronLib);
			
			window.WebViewer({
				//licenseKey: 'YOUR_LICENSE_KEY',
				//path: '../../lib',
				path: (navigator.userAgent.toLowerCase().indexOf('electron/') > -1) ? 'lib' : window.location.origin+'/lib',
				css: (navigator.userAgent.toLowerCase().indexOf('electron/') > -1) ? 'lib/ocvc_initializer_pdftron.css' : window.location.origin+'/lib/ocvc_initializer_pdftron.css',
				type: 'html5',
				//pdfBackend: 'pnacl',
				//pdftronServer: 'http:	//localhost:8090/',
				//licenseKey: 'PDFTron Systems Inc.:OEM:PDFTron Server::B+:AMS(20200318):47A54A420447A80A3360B13AC9826375E3615FE5B9934ACA95C515C452D540D2811131F5C7',
				l: "Oneclick Diseno y Software S.L.(oneclick.es):OEM:Ink2Cloud::B+:AMS(20201030):53A541620477380A3360B13AC982537860611FA56C58857B1CA56594BF6C30B622EABEF5C7",
				//fullAPI: true,
				//preloadWorker: 'all',
				//useDownloader: true,
				//preloadWorker: 'all',
				disabledElements: [
					'rotateButtons',
					'coverLayoutButton',
					'textToolGroupButton', // deshabilitar, grupo herramientas de texto, header					
					'textHighlightToolButton', // deshabilitar, herramienta de texto, menu contextual
					'textUnderlineToolButton', // deshabilitar, herramienta de texto, menu contextual
					'textSquigglyToolButton', // deshabilitar, herramienta de texto, menu contextual
					'textStrikeoutToolButton', // deshabilitar, herramienta de texto, menu contextual
					'highlightToolButton' // deshabilitar, herramienta de texto, menu contextual
					//'highlightToolButton',
					//'highlightToolButton2',
					//'highlightToolButton3',
					//'highlightToolButton4',
					//'underlineToolButton', 'strikeoutToolButton', 'squigglyToolButton'
				]
			}, document.getElementById( containerDivLoadPdfTron )).then( function(instance) {
			
				// Instancia de PDFTron
				instancePdfTron = instance;
				docViewer = instancePdfTron.docViewer;
				var GAnnotations = instance.Annotations;
				
				// Configurando lenguaje
				instancePdfTron.setLanguage( 'en' );
				//instance.setMaxZoomLevel(1.5); // or setMaxZoomLevel(1.5)
				//instance.setMinZoomLevel(0.1); // or setMinZoomLevel(0.1)
				
				annotManager = instancePdfTron.annotManager;
		
				annotManager.setAnnotationDisplayAuthorMap(function(annotation) {
					// falls back to current value of Author if no value in map
					return myAuthorMap[annotation.Author] || annotation.Author;
				});
				
				//mToolManager.AnnotationPermissionForAnnotType(pdftron.PDF.PTExtendedAnnotType.Highlight).CanCreate = false;
				    //instance.disableTools([ 'AnnotationCreateHighlight' ]); // hides DOM element + disables shortcut

				instancePdfTron.setCustomNoteFilter(function(annot) {
					//return !(annot.Subject instanceof instance.Annotations.RectangleAnnotation)
					if (annot.Subject === 'imageLink' || annot.Subject === 'audioLink' || annot.Subject === 'videoLink' || annot.Subject === 'htmlLink' || annot.Subject === 'urlLink' || annot.Subject === 'pdfLink'){
						return false;
					}else{
						return true;
					}
				});
		
		
				// Configuración de ToolBar
				var ToolBarCustom = [
					{dataElement: "leftPanelButton", element: "leftPanel", img: "ic_left_sidebar_black_24px", type: "toggleElementButton", initialState:'hide'},
					{type: 'divider', hidden: [ 'mobile' ] },
					{toolName: "Pan", type: "toolButton"},
					{toolName: "AnnotationEdit", type: "toolButton"},			
					{dataElement: "freeHandToolGroupButton", hidden: [], title: 'tool.drawing', toolGroup: "freeHandTools", type: "toolGroupButton"},
					{dataElement: "textToolGroupButton", hidden: [], title: "tool.underline", toolGroup: "textTools", type: "toolGroupButton"},			
					{dataElement: "shapeToolGroupButton", element: "leftPanel", hidden: [], title: "component.shapeToolsButton", toolGroup: "shapeTools", type: "toolGroupButton" },
					{toolName: "AnnotationCreateFreeText", type: "toolButton"},
					{type: 'spacer', hidden: [ 'mobile' ] },					
					{dataElement: "viewControlsButton",element: "viewControlsOverlay",img: "ic_viewer_settings_black_24px",title: "component.viewControlsOverlay",type: "toggleElementButton"},										
					//{type: 'actionButton', img: 'ic_fit_page_black_24px', title: 'Fullscreen', onClick: function() { instance.toggleFullScreen(); } },
					{dataElement: "zoomInButton", element: "rightPanel", img: "ic_zoom_in_black_24px", title: 'action.zoomIn', type: "actionButton", onClick: 
						function(){
							//console.log(instance)
							if(instance.docViewer.getZoom() <= 1.5){
								instance.docViewer.zoomTo(instance.docViewer.getZoom() + 0.25);								
							}
						}
					},
					{dataElement: "zoomOutButton", element: "rightPanel", img: "ic_zoom_out_black_24px", title: 'action.zoomIn', type: "actionButton", onClick: 
						function(){
							if(instance.docViewer.getZoom() >= 0.25){
								instance.docViewer.zoomTo(instance.docViewer.getZoom() - 0.25);
							}
						}
					},
					{dataElement: "showMagentaLayer", element: "rightPanel", img: "assets/show_magenta.png", title: 'Show Magenta', type: "actionButton", onClick: 
						function(){							
							//console.log('ver capa magenta');
							instance.disableElements([ 'showMagentaLayer' ]);
							instance.enableElements([ 'hideMagentaLayer' ]);
							
							showAndHideLayers('Magenta', true);
						}
					},
					{dataElement: "hideMagentaLayer", element: "rightPanel", img: "assets/hide_magenta.png", title: 'Hide Magenta', type: "actionButton", onClick: 
						function(){							
							//console.log('ocultar capa magenta');
							instance.enableElements([ 'showMagentaLayer' ]);
							instance.disableElements([ 'hideMagentaLayer' ]);
							
							showAndHideLayers('Magenta', false);							
						}
					},
					{dataElement: "printButtonCustom", element: "rightPanel", img: "assets/print.png", title: 'action.print', type: "actionButton" , onClick: 
						function(){
							instance.print();
						}
					},
					{dataElement: "downloadButtonCustom", element: "rightPanel", img: "assets/download.png", title: 'action.download', type: "actionButton" , onClick: 
						function(){
							var _file_download = GLOBAL_FILE;
							console.log('PREV DOWNLOAD: '+_file_download);							
							try{ _file_download = _file_download.replace('_pptx.xod', '.pptx'); }catch(e){ console.log(e); }
							try{ _file_download = _file_download.replace('_xlsx.xod', '.xlsx'); }catch(e){ console.log(e); }
							try{ _file_download = _file_download.replace('_docx.xod', '.docx'); }catch(e){ console.log(e); }
							try{ _file_download = _file_download.replace('.xod', '.pdf'); }catch(e){ console.log(e); }
							console.log('DOWNLOAD: '+_file_download);							
							downloadme(_file_download)
						}
					}
				];
				
				// Estilos por defecto de texto
				docViewer.getTool('AnnotationCreateFreeText').setStyles(currentStyle => ({
					TextColor: new GAnnotations.Color(0, 0, 0),
					FontSize: '35pt'
				}));
                
				//console.log(instancePdfTron)
				
				instancePdfTron.setHeaderItems(function(header) {
					var items = header.getItems();					
					/*items.forEach(function(e){
						console.log(e)
					})*/					
					header.update(ToolBarCustom);
				});
				instance.disableElements([ 'hideMagentaLayer' ]);
				instance.disableElements([ 'showMagentaLayer' ]);
				// Fin Configuración de ToolBar				
				
				// Retornar datos
				docViewer.on('documentLoaded', function(){
					
					console.log("docViewer - documentLoaded()")
					
					// Si se oculta antes de terminar de cargar
					if( GLOBAL_FILE != "" ){						
						DOC_IS_LOAD = true;
						
						// IMPORTAR ANOTACIONES DE ARCHIVO
						importAnnotationsXFDF();
						
						// IMPORTAR ANOTACIONES PRIVADAS
						importAnotarionsPrivate();
						
						//console.log('CARGADOOOOO = ' + instancePdfTron.getPageCount())
						CALLBACK_LOAD( {pages:instancePdfTron.getPageCount()} );

						// Ocultando capa Magenta al inicar
						try{ showAndHideLayers('Magenta', false); }catch(_er){ }

						//annotManager.setCurrentUser(USER_ID);
						//instancePdfTron.setAnnotationUser(USER_NAME);
						
						try{ SHOW_AT = (SHOW_AT != '') ? parseInt(SHOW_AT) : ''; }catch(e){}
						try{
							if( (SHOW_AT != '') && (SHOW_AT != null) && (SHOW_AT != undefined) && (SHOW_AT != NaN) && (SHOW_AT != 'NaN')  && (typeof(SHOW_AT) != 'string') ){
								setTimeout(function(){
									docViewer.setCurrentPage(SHOW_AT);								
								}, 500);
							}						
						}catch(e){}
					}
					
				}).on('documentUnloaded', function(){
					//console.log('documentUnloaded')
				}).on('finishedRendering', function(){
					//console.log('finishedRendering')
					IS_FINISHEDRENDERING = true;
				}).on('Error', function(){
					console.log('onError')
				});
				
	
	
				// Custom properties INI - Tratamiento para propiedades propias en anotaciones, para que las lea y las guarde en relaccion al XFDF
				const Annotations = instancePdfTron.Annotations;

				// 
				let serialize = Annotations.Annotation.prototype.serialize;
				Annotations.Annotation.prototype.serialize = function () {
					var el = serialize.apply (this, arguments);
					if (this.dataCustom) el.setAttribute ('data-custom', this.dataCustom);
					return el;
				};

				// 
				let deserialize = Annotations.Annotation.prototype.deserialize;
				Annotations.Annotation.prototype.deserialize = function (el) {
					deserialize.apply (this, arguments);
					let subject = this.Subject;
					//if (subject === 'imageLink' || subject === 'audioLink' || subject === 'videoLink' || subject === 'htmlLink') this.dataCustom = el.getAttribute ('data-custom');					
					this.dataCustom = el.getAttribute ('data-custom');
				};
				// Custom properties END
				
				//instance.disableAnnotations();
				docViewer.on ('annotationsLoaded', function(){
					// annotManager.on ('annotationChanged',  this.annotationChanged);
					//try{ console.timeEnd('loaded-anotations'); }catch(e){}
				});
				
				annotManager.on ('annotationSelected', annotationSelected);		
				
				annotManager.on('annotationChanged', function(e, annotations, action) {				
					
					if (e.imported) { return; }		
	  
					try{
						//instancePdfTron.selectors.getCustomPanels()[0].panel.render();							
					}catch(e){}

					annotations.forEach(function(annot) {
						
						if ( IS_FINISHEDRENDERING ) {
							
							// Recuperando ANNOTATION
							var _custom = annotManager.exportAnnotations({ annotList: [ annot ] });					

							if( _custom.indexOf('subject="imageLink"') >= 0 ){
							}else if( _custom.indexOf('subject="htmlLink"') >= 0 ){
							}else if( _custom.indexOf('subject="audioLink"') >= 0 ){
							}else if( _custom.indexOf('subject="videoLink"') >= 0 ){
							}else if( _custom.indexOf('subject="urlLink"') >= 0 ){
							}else if( _custom.indexOf('subject="pdfLink"') >= 0 ){
							}else{
								
								var _guid = _custom.split('name="')[1];
								_guid = _guid.split('"')[0];
								var _content = _custom.split('<annots>')[1];
								_content =  _content.split('</annots>')[0];

								// Creando XFDF
								if (action === 'add') {
									onAddAnnotation( _guid, _content );
								}
								
								// Modificando XFDF
								if (action === 'modify') {
									onUpdateAnnotation( _guid, _content );
								}
								
								// Eliminando XFDF
								if (action === 'delete') {
									
									onDeleteAnnotation( _guid );
									
									// Refresh Annotation in Annotations Panel
									let _parent = annot.InReplyTo;
									if( (_parent != undefined) && (_parent != null) && (_parent != '') ){
										_parent = annotManager.getAnnotationById(_parent, annotManager.getAnnotationsList());										
										annotManager.hideAnnotation(_parent);
										setTimeout(function(){										
											annotManager.showAnnotation(_parent);
											annotManager.selectAnnotation (_parent);
										},0);
										
									}
									// Refresh Annotation in Annotations Panel
								}
							}
						}
					});
				});
				
				
				
				//// Visualización de Panels
				//// instance.setActiveLeftPanel('notesPanel');
				//// instance.setActiveLeftPanel('outlinesPanel');
				//// this.instance.openElement('notesPanel')				
				instancePdfTron.setActiveLeftPanel('thumbnailsPanel');
				
				
				//var LayoutMode = instancePdfTron.LayoutMode;
				//instancePdfTron.setLayoutMode(LayoutMode.Single);

				// Control de errores
				const _p_iframe = document.getElementById(containerDivLoadPdfTron).querySelector("iframe").contentWindow;
				_p_iframe.addEventListener("loaderror", function(e){
					console.log("An error has occurred", e);
					
					try{ document.getElementById('console__black').innerHTML += '<p>An error has occurred</p>'; }catch(e){}
					try{ document.getElementById('console__black').innerHTML += '<p>'+e+'</p>'; }catch(e){}
					
					try{
						if( e.detail.indexOf('status 0.') >= 0 ){
							showError('FILE_HAVE_ERROR');
						}else{						
							showError('FILE_NOT_FOUND');
						}
					}catch(e){
						showError('FILE_NOT_FOUND');						
					}
				});
				// Control de errores

			});
		}
	}
	
	function downloadme(fileName){
		fileURL = fileName;
		if (!window.ActiveXObject) {
			var save = document.createElement('a');
			save.href = fileURL;
			save.target = '_blank';
			save.download = fileName || 'unknown';

			var evt = new MouseEvent('click', {
				'view': window,
				'bubbles': true,
				'cancelable': false
			});
			save.dispatchEvent(evt);

			(window.URL || window.webkitURL).revokeObjectURL(save.href);
		}

		// for IE < 11
		else if ( !! window.ActiveXObject && document.execCommand)     {
			var _window = window.open(fileURL, '_blank');
			_window.document.close();
			_window.document.execCommand('SaveAs', true, fileName || fileURL)
			_window.close();
		}
	}
	
	// Seleccionando elemento en el Documento
	function annotationSelected (event, annotations, action){
		
		if(annotations == null){ return; }
		
		let annotation = annotations[0];
		
		if (action === 'selected'){
			
			let subject = annotation.Subject;
			
			if( subject == 'imageLink' || subject == 'audioLink' || subject == 'videoLink' || subject == 'htmlLink' || subject == 'urlLink' || subject == 'pdfLink'  ){
				getDataContent( annotation.dataCustom, subject );
				//annotManager.deselectAnnotation (annotation);
				setTimeout(function(){
					annotManager.deselectAnnotation (annotation);
					
				}, 0);				
			}
		}
	}
	
	// Variables de consumo
	var CONTENT_GUID = '';
	var CONSUMPTION_GUID = '';
	var SESSION_GUID = '';
	var STARTED_AT = Date.now();
	var STATE_PATH_MEDIA = '';
	
	// Obtener datos del recurso
	function getDataContent(_guid, _subject){
		STATE_PATH_MEDIA = '';
		
  
  
		//console.log('GETDATACONTENT------------------------')
								

		// Si ya existe model, eliminar
		var pre_element = document.getElementById('hotspot-tron-modal');
		if( pre_element ){ pre_element.parentNode.removeChild(pre_element); }
		
		var _inner = document.createElement("div");
		_inner.id = "hotspot-tron-modal";
		_inner.className = THEME;
		_inner.innerHTML = '<div id="hotspot-tron-content-loading" class="'+THEME+'"><div class="ftd_logo"></div><div class="progress_loading" id="progress_loading"></div></div>';
		document.body.appendChild(_inner);
		
		//var _data = {url:"http://localhost:3007/files/una.pdf"};		
		//showModal('123321321', 'pdfLink', _data);
		//return;

		if( _guid.indexOf('/') >= 0 ){
			STATE_PATH_MEDIA = 'relative';		
			
			var _data = {};			
			PATH_ROOT = (PATH_ROOT.substr(-1) == '/' && _guid.substr(0,1) == '/') ? PATH_ROOT.slice(0, -1) : PATH_ROOT;
			_data.url = (_subject == 'urlLink') ? _guid : (PATH_ROOT + _guid);
			
			showModal(_guid, _subject, _data);
			//showModal(_guid, 'imageLink', _data);
		}else{			
			CONTENT_GUID = _guid;

			getContentHotspot({guid:_guid, type_guid:_subject}, function(_data){				

				try{ if(typeof(_data.url) == 'undefined'){ errorLoadHotspotMedia(); return; } }catch(rer){}
				
				if(_data == 'FILE_NOT_FOUND'){
					errorLoadHotspotMedia();
				}else{				
					switch(_data.type_guid){
						case 'CTTY_03': showModal(_guid, 'videoLink', _data); break;
						case 'CTTY_04': showModal(_guid, 'audioLink', _data); break;
						case 'CTTY_07': showModal(_guid, 'imageLink', _data); break;
						case 'CTTY_08': showModal(_guid, 'htmlLink', _data); break;
						case 'CTTY_05': showModal(_guid, 'pdfLink', _data); break;
						case 'CTTY_06': showModal(_guid, 'urlLink', _data); break;
					}
				}
			});
		}
	}
	
	function errorLoadHotspotMedia(){
		var _eldiv = document.getElementById('progress_loading');
		_eldiv.classList.remove("progress_loading");
		_eldiv.classList.add("error_loading");
		
		try{
			var pre_element = document.getElementById('btn_file_not_fount');
			pre_element.parentNode.removeChild(pre_element);
			var pre_element = document.getElementById('txt_file_not_fount');
			pre_element.parentNode.removeChild(pre_element);			
		}catch(e){}
		
		var _inner_txterrors = document.createElement("div");
		_inner_txterrors.innerHTML = '<div class="txt_file_not_fount" id="txt_file_not_fount">'+LANG_LIBRARY.VISOR_LIB_PDF_PLAYERS_MESSAGE_FILE_NOT_FOUND+'</div> <div class="btn_file_not_fount" id="btn_file_not_fount">'+LANG_LIBRARY.VISOR_LIB_PDF_PLAYERS_MESSAGE_FILE_NOT_FOUND_CLOSE+'</div>';
		_eldiv.appendChild(_inner_txterrors);
		
		// Cerrar Modal
		document.getElementById('btn_file_not_fount').onclick = function(){
			var pre_element = document.getElementById('hotspot-tron-modal');
			pre_element.parentNode.removeChild(pre_element);
		}
	}
	
	var _timer_trece;
	var _timer_start = 0;
	var _timer_end = 0;
	var _timer_idconsumption = '';
	
	function hideLoadingHotspot(_player, _duration, _type){
		var elem = document.getElementById('hotspot-tron-content-loading');
		
		//if( _type == 'image' || _type == 'url' || STATE_PATH_MEDIA == 'relative' ){
		if( STATE_PATH_MEDIA == 'relative' ){
			try{ _player.classList.remove("htm_element_wrap_hidden"); }catch(e){}
			try{ elem.parentNode.removeChild(elem); }catch(e){}
			return;
		}
		
		_player.classList.remove("htm_element_wrap_hidden");
		try{ elem.parentNode.removeChild(elem); }catch(e){}
		
	
	}
	
	function finishConsumptionSesion(){
	}
	
	function sendTrace(){
		
		if( STATE_PATH_MEDIA == 'relative' ){ return; }
		
		// Si no está el contenedor, teminar consumo
		if( !document.getElementById('hotspot-tron-modal') ){
			sendTraceEnd();
			return;
		}
		
		// Enviando traza de consumo
		
		var _data_trace = {
			content_guid: CONTENT_GUID,
			consumption_guid: CONSUMPTION_GUID,
			started_at: STARTED_AT,
			ended_at: Date.now(),
			progress_start: _timer_start,
			progress_end: _timer_end,
			session_guid: SESSION_GUID
		}
		
		reportTraceConsumption(_data_trace, function(e){ /*console.log(e);*/ });
	}
	
	function sendTraceEnd(){
		
		if( STATE_PATH_MEDIA == 'relative' ){ return; }
		
		console.log('End consumption...')
		
		var _data_trace_finish = {
			consumption_guid: CONSUMPTION_GUID,
			session_guid: SESSION_GUID
		}		
		finishSesionConsumption(_data_trace_finish, function(e){ console.log(e); });
		
		clearInterval(_timer_trece);
	}
	
	function showModal(_guid, _type, _data){
		_timer_start = 0;
		_timer_end = 0;
		var elem = document.getElementById('hotspot-tron-content-loading');
		
		//setTimeout(function(){

			switch(_type){
				case 'pdfLink':{
					
					var __token;
					var responseUrl;
					
					if(navigator.userAgent.toLowerCase().indexOf('electron/') > -1){
						try{ document.getElementById('console__black').innerHTML += '<p>PDF ELECTRON</p>'; }catch(e){}
						
						try{ document.getElementById('console__black').innerHTML += '<p>PDF TODO _data.url: '+_data.url+'</p>'; }catch(e){}
						
						__token = _data.url.split('?token=')[1];
						_data.url = _data.url.split('?token=')[0];
					
						try{ document.getElementById('console__black').innerHTML += '<p>PDF _data.url: '+_data.url+'</p>'; }catch(e){}
						try{ document.getElementById('console__black').innerHTML += '<p>PDF __token: '+__token+'</p>'; }catch(e){}
						
					}else{
						try{ document.getElementById('console__black').innerHTML += '<p>PDF OTRA APP</p>'; }catch(e){}
						try{ __token = JSON.parse(localStorage.getItem('session')).token; }catch(e){}
					}
					
					// Token por parámetro.
					try{ if(_data.__token != undefined){ __token = _data.__token; } }catch(err){}
					
					const xhr_pdf = new XMLHttpRequest();
					xhr_pdf.open('GET', _data.url, true);
					xhr_pdf.setRequestHeader('Authorization', __token)
					xhr_pdf.send();
					
					xhr_pdf.onreadystatechange = function(e) {
						
						try{ document.getElementById('console__black').innerHTML += '<p>xhr_pdf.readyState: '+xhr_pdf.readyState+'</p>'; }catch(e){}
						try{ document.getElementById('console__black').innerHTML += '<p>xhr_pdf.status: '+xhr_pdf.status+'</p>'; }catch(e){}

						if(xhr_pdf.readyState == 4 && xhr_pdf.status == 200){
							
							try{ document.getElementById('console__black').innerHTML += '<p>PDF xhr_pdf.response: '+xhr_pdf.response+'</p>'; }catch(e){}
							
							var _response;
							try{
								_response = JSON.parse(xhr_pdf.response);							
								responseUrl = _response.data.url;								
							}catch(erf){ 
								console.log(erf);
								responseUrl = xhr_pdf.responseURL;
							}
						
							try{						
								let responseCookies = _response.data.cookies;						
								responseCookies.forEach((cookie) => {
									console.log("HOTSPOT Write cookie: ", cookie);
									document.cookie = cookie;
								});
							}catch(err_ret){console.log(err_ret);}
							
							var containerDivLoadPdfTronHotspot = 'container_pdflink';
						
							var _htmlplayer = 	'<div id="container_pdflink_close"></div> <div id="container_pdflink_title">'+ (_data.name || 'Test') +'</div> <div id="'+ containerDivLoadPdfTronHotspot +'"></div>';

							var _inner_pdflink = document.createElement("div");
							_inner_pdflink.id = "htm_pdf_wrap";
							_inner_pdflink.classList.add("htm_element_wrap_hidden");
							_inner_pdflink.innerHTML = _htmlplayer;
							
							document.getElementById('hotspot-tron-modal').appendChild(_inner_pdflink);

							var _elelement = document.getElementById('container_pdflink');

							window.WebViewer({
								path: (navigator.userAgent.toLowerCase().indexOf('electron/') > -1) ? 'lib' : window.location.origin+'/lib',
								css: (navigator.userAgent.toLowerCase().indexOf('electron/') > -1) ? 'lib/ocvc_initializer_pdftron.css' : window.location.origin+'/lib/ocvc_initializer_pdftron.css',
								type: 'html5',
								l: "Oneclick Diseno y Software S.L.(oneclick.es):OEM:Ink2Cloud::B+:AMS(20201030):53A541620477380A3360B13AC982537860611FA56C58857B1CA56594BF6C30B622EABEF5C7",
								disabledElements: [ 'textPopup', 'contextMenuPopup' ]
							}, document.getElementById( containerDivLoadPdfTronHotspot )).then( function(instance_hotspot) {
								// Instancia de PDFTron

								instance_hotspot.loadDocument(responseUrl, {
									customHeaders: { Authorization: __token },
									withCredentials: true,
									useDownloader: true
								});

								docViewerHotspot = instance_hotspot.docViewer;						
								// Configurando lenguaje
								instance_hotspot.setLanguage( 'pt' );

								instance_hotspot.setHeaderItems(function(header) {
									var items = header.getItems();				
									header.update([]);
								});

								document.getElementById( containerDivLoadPdfTronHotspot ).addEventListener('pageChanged', function(e_page_change) {
									_timer_start = ( parseInt(e_page_change.detail[0]) - 1 );
									_timer_end = parseInt(e_page_change.detail[0]);
								});
								
								// Retornar datos
								docViewerHotspot.on('documentLoaded', function(){	
									_inner_pdflink.classList.remove("htm_element_wrap_hidden");
									hideLoadingHotspot(document.getElementById("htm_pdf_wrap"), instance_hotspot.getPageCount(), 'document');						
								}).on('documentUnloaded', function(){ }).on('finishedRendering', function(){ }).on('Error', function(){ });

								// Control de errores
								const _p_iframe = document.getElementById(containerDivLoadPdfTronHotspot).querySelector("iframe").contentWindow;
								_p_iframe.addEventListener("loaderror", function(e){
									console.log("An error has occurred", e);
									errorLoadHotspotMedia();
								});
								// Control de errores		
							});
							
							// Cerrar Modal
							document.getElementById('container_pdflink_close').onclick = function(){
								var pre_element = document.getElementById('hotspot-tron-modal');
								pre_element.parentNode.removeChild(pre_element);
							}
							
							_timer_start = 0;
							_timer_end = 1;
							
						}
					}
					
				}					
				break;
				case 'imageLink':{
				
					var _htmlplayer = 	'<div id="htm_image_controls">'+
										'	<div id="htm_image_close"></div>'+
										'	<div id="htm_image_zoomin"></div>'+
										'	<div id="htm_image_zoomout"></div>'+
										'	<div id="htm_image_fullscreen"></div>'+
										'	<div id="htm_image_fullscreen_out" class="htm_image_control_hide"></div>'+
										'</div>'+
										'<img src="' + _data.url + '" id="htm_image_source" />';
										
					var _inner_image = document.createElement("div");
					_inner_image.id = "htm_image_wrap";
					_inner_image.classList.add("htm_element_wrap_hidden");
					_inner_image.innerHTML = _htmlplayer;
					
					document.getElementById('hotspot-tron-modal').appendChild(_inner_image);
					var _elelement = document.getElementById('htm_image_source');

					_elelement.onload = function() {
						try{
							
							PanZoom("#htm_image_source");
							
							// Ajustar imagen si es >= a window
							var myImg = document.getElementById("htm_image_source");
							var currWidth = myImg.clientWidth;
							var currHeight = myImg.clientHeight;
							var window_w = window.innerWidth;
							var window_h = window.innerHeight;
							
							if( currHeight >= window_h ){
								currHeight = (window_h - 150)
								myImg.style.height = currHeight + "px";
							}
							
							var currWidth = myImg.clientWidth;
							
							if( currWidth >= window_w ){
								currWidth = (window_w - 150)
								myImg.style.width = currWidth + "px";
								myImg.style.height = "auto";
							}
							
							// Ajustar imagen si es >= a window
							
							_inner_image.classList.remove("htm_element_wrap_hidden");
							hideLoadingHotspot(document.getElementById("htm_image_wrap"), 1, 'image');							
							
						}catch(e){}
					};
					
					document.getElementById('htm_image_source').addEventListener('error', function(event) { 
						console.log(event)
						errorLoadHotspotMedia();
					}, true);
					
					// Cerrar Modal
					document.getElementById('htm_image_close').onclick = function(){
						//sendTraceEnd();
						var pre_element = document.getElementById('hotspot-tron-modal');
						pre_element.parentNode.removeChild(pre_element);
					}
					
					// Fullscreen
					document.getElementById('htm_image_fullscreen').onclick = function(){
						//console.log('pause');
						//_video.pause();				
						document.getElementById("htm_image_fullscreen_out").classList.remove("htm_image_control_hide");
						document.getElementById("htm_image_fullscreen").classList.add("htm_image_control_hide");
						
						var _pop = document.getElementById('htm_image_wrap');
						if (_pop.requestFullscreen) {
							_pop.requestFullscreen();
						} else if (_pop.mozRequestFullScreen) {
							_pop.mozRequestFullScreen();
						} else if (_pop.webkitRequestFullscreen) {
							_pop.webkitRequestFullscreen();
						} else if (_pop.msRequestFullscreen) {
							_pop.msRequestFullscreen();
						}
		
					}
					
					// Salir de Fullscreen
					document.getElementById('htm_image_fullscreen_out').onclick = function(){
						//console.log('pause');
						//_video.pause();				
						document.getElementById("htm_image_fullscreen").classList.remove("htm_image_control_hide");
						document.getElementById("htm_image_fullscreen_out").classList.add("htm_image_control_hide");
						
						var _pop = document.getElementById('htm_image_wrap');
						if (document.exitFullscreen) {
							document.exitFullscreen();
						} else if (document.webkitExitFullscreen) {
							document.webkitExitFullscreen();
						} else if (document.mozCancelFullScreen) {
							document.mozCancelFullScreen();
						} else if (document.msExitFullscreen) {
							document.msExitFullscreen();
						}
					}
					
					_timer_start = 0;
					_timer_end = 1;
					
				}					
				break;
				case 'audioLink':{
				
					var _htmlplayer = 	'<div id="htm_audio_close"></div>'+
										'<audio controls autoplay id="htm_audio_source">'+
										'	<source src="'+_data.url+'" />'+
										'	<p>Su navegador no soporta audio HTML5. Aquí hay un <a href="'+_data.url+'">enlace al audio</a> en su lugar.</p>'+
										'</audio>'+
										'<div id="htm_audio_controls">'+
										'	<div id="htm_audio_control_replay"></div>'+
										'	<div id="htm_audio_control_play"></div>'+
										'	<div id="htm_audio_control_pause" class="htm_audio_control_pause_hidden"></div>'+
										(
											(_data.thumbnail != '') ? '<div id="htm_audio_control_thumb" style="background-image: url('+_data.thumbnail+');"></div>' : ''
										)+
										'	<div id="htm_audio_times">'+
										'		<div id="htm_audio_time_full">00:00</div>'+
										'		<div id="htm_audio_time_part">00:00</div>'+
										'	</div>'+
										'	<div id="htm_audio_progressfull">'+
										'		<input type="range" min="0" max="100" step="0.1" value="0" id="htm_audio_progressfull_slider" />'+
										//'		<div id="htm_audio_progress_bull"></div>'+
										//'		<div id="htm_audio_progress"></div>'+
										'	</div>'+
										'</div>';
										
					var _inner_audio = document.createElement("div");
					_inner_audio.id = "htm_audio_wrap";
					_inner_audio.classList.add("htm_element_wrap_hidden");
					_inner_audio.innerHTML = _htmlplayer;
					
					document.getElementById('hotspot-tron-modal').appendChild(_inner_audio);
					
					var _audio = document.getElementById("htm_audio_source");
					
					document.getElementById('htm_audio_source').addEventListener('error', function(event) { 
						console.log(event)
						errorLoadHotspotMedia();
					}, true);
					
					_audio.onloadeddata = function(e) {};
					_audio.onloadedmetadata  = function(e) {};
					_audio.oncanplay   = function(e) {
						try{
							hideLoadingHotspot(document.getElementById("htm_audio_wrap"), _audio.duration, 'audio');
							document.getElementById("htm_audio_time_full").innerHTML = getHumanTime(_audio.duration);
						}catch(e){}
					};
					
					// Progress Bar
					var rng = document.getElementById("htm_audio_progressfull_slider");
					
					rng.addEventListener("input", function() { _audio.pause(); }, false); 	
					
					rng.addEventListener("change", function() {
						var _progress_seek = parseFloat((_audio.duration * rng.value) / 100).toFixed(1);
						_audio.currentTime = _progress_seek;
						_audio.play();
					}, false);
					// Progress Bar
					
					_audio.ontimeupdate = function() {
						try{
							var _progress = ((_audio.currentTime * 100)/_audio.duration);
							try{ rng.value = parseFloat(_progress).toFixed(1); }catch(e){}
							document.getElementById("htm_audio_time_part").innerHTML = getHumanTime(_audio.currentTime);	
							// Consumo actual
							_timer_end = parseInt(_audio.currentTime);
						}catch(e){}
					};
					_audio.onplay = function() {
						document.getElementById("htm_audio_control_pause").classList.remove("htm_audio_control_pause_hidden");
						_timer_start = _audio.currentTime;
						_timer_end = _audio.currentTime;
					};
					_audio.onpause = function() {
						try{
							document.getElementById("htm_audio_control_pause").classList.add("htm_audio_control_pause_hidden");							
						}catch(e){}
						_timer_start = _audio.currentTime;
						_timer_end = _audio.currentTime;
					};
					_audio.onended = function() {
						document.getElementById("htm_audio_control_pause").classList.add("htm_audio_control_pause_hidden");
					};
					
					// Eventos
					
					// Play
					document.getElementById('htm_audio_control_play').onclick = function(){
						_audio.play();
					}
					// Pause
					document.getElementById('htm_audio_control_pause').onclick = function(){
						_audio.pause();				
					}
					// Replay
					document.getElementById('htm_audio_control_replay').onclick = function(){
						_audio.currentTime = 0;
					}
					// Cerrar Modal
					document.getElementById('htm_audio_close').onclick = function(){
						sendTraceEnd();
						var pre_element = document.getElementById('hotspot-tron-modal');
						pre_element.parentNode.removeChild(pre_element);
					}
				}
				break;
				case 'videoLink':{
					
					var subtitle_time_start = [];
					var subtitle_time_end = [];
					var subtitle_ar = [];


					var _htmlplayer = 	'<div id="htm_video_wrap_content">'+
										'	<div id="htm_video_close"></div>'+
										'	<video id="htm_video_source" autoplay >'+
										'		<source src="'+_data.url+'" type="video/mp4" />'+
										'		<p>Su navegador no soporta video HTML5. Aquí hay un <a href="'+_data.url+'">enlace al video</a> en su lugar.</p>'+
										'	</video>'+
										'	<div id="htm_video_controls">'+
										'		<div id="htm_video_control_play" class=""></div>'+
										'		<div id="htm_video_control_pause" class="htm_video_control_hide"></div>'+
										'		<div id="htm_video_times">'+
										'			<div id="htm_video_time_full">00:00</div>'+
										'			<div id="htm_video_time_part">00:00</div>'+
										'		</div>'+
										'		<div id="htm_video_progressfull">'+
										'			<input type="range" min="0" max="100" step="0.1" value="0" id="htm_video_progressfull_slider" />'+
										//'			<div id="htm_video_progress_bull"></div>'+
										//'			<div id="htm_video_progress"></div>'+
										'		</div>'+
										'		<div id="htm_video_control_fullscreen"></div>'+
										'		<div id="htm_video_control_restorescreen" class="htm_video_control_hide"></div>'+
										'		<div id="htm_video_control_volume"></div>'+
										'		<div id="htm_video_control_mute" class="htm_video_control_hide"></div>'+
										'	</div>'+
										'</div>'+
										'<div class="vSubtitles"></div>';
										
					var _inner_video = document.createElement("div");
					_inner_video.id = "htm_video_wrap";
					_inner_video.classList.add("htm_element_wrap_hidden");
					_inner_video.innerHTML = _htmlplayer;
					document.getElementById('hotspot-tron-modal').appendChild(_inner_video);				
					
					var _video = document.getElementById("htm_video_source");
					
					document.getElementById('htm_video_source').addEventListener('error', function(event) { 
						console.log(event)
						errorLoadHotspotMedia();
					}, true);
					
					_video.oncanplay = function(e) {
						try{
							hideLoadingHotspot(document.getElementById("htm_video_wrap"), _video.duration, 'video');
							document.getElementById("htm_video_time_full").innerHTML = getHumanTime(_video.duration);

							var _file_subtitle = _data.url.replace( (_data.url.split('.')[ (_data.url.split('.').length - 1) ]) , 'srt' );
							
							try{ document.getElementById('console__black').innerHTML += '<p>GET _file_subtitle: '+_file_subtitle+'</p>'; }catch(e){}
							
							try{
								const xhr = new XMLHttpRequest();
								xhr.open('GET', _file_subtitle, true);
								xhr.send();
								xhr.onreadystatechange = function(e) {
									
									try{ document.getElementById('console__black').innerHTML += '<p>xhr.readyState: '+xhr.readyState+'</p>'; }catch(e){}
									try{ document.getElementById('console__black').innerHTML += '<p>xhr.status: '+xhr.status+'</p>'; }catch(e){}
									
									if(xhr.readyState == 4){
										if(xhr.status == 200){

											document.getElementsByClassName("vSubtitles")[0].classList.add("vSubtitles_show");
											
											var __ar = xhr.response.split('\n');
											
											var __pas = false;
											var __new_line = true;
											var __ar_strings = [];
											
											for(var i=0; i<__ar.length; i++){
												
												if( __ar[i].length === 0 || !__ar[i].trim() ){
													__pas = false;
												}
												
												if(__pas){
													// Si hay salto de linea y continua 
													if(__new_line){	
														__ar_strings[ __ar_strings.length ] = __ar[i];
														__new_line = false;
													}else{
														__ar_strings[ __ar_strings.length - 1 ] += __ar[i];
													}								
												}else{								
													//console.log('+++++ ' + __ar[i]);
												}
												
												if( __ar[i].indexOf('-->') >= 0 ){								
													
													var _timen = __ar[i].split(' --> ');			
													try{
														var _timen_start = _timen[0].split(',')[0].split(':');								
														_timen_start = ( (parseInt(_timen_start[1]) * 60) + parseInt(_timen_start[2])  );
														subtitle_time_start.push(_timen_start);									
													}catch(e){}
													
													try{
														var _timen_end = _timen[1].split(',')[0].split(':');								
														_timen_end = ( (parseInt(_timen_end[1]) * 60) + parseInt(_timen_end[2])  );
														subtitle_time_end.push(_timen_end);									
													}catch(e){}
													
													__pas = true;
													__new_line = true;
													
												}
											}
											
											subtitle_ar = __ar_strings;											
										} 
									}
									
								}.bind(this);
							}catch(e_get_subtitle){
								try{ document.getElementById('console__black').innerHTML += '<p>GET _file_subtitle ERROR: '+e_get_subtitle+'</p>'; }catch(e){}
							};

						}catch(e){}
					};
					
					// Progress Bar
					var rng_video = document.getElementById("htm_video_progressfull_slider");
					rng_video.addEventListener("input", function() { _video.pause(); }, false); 					
					
					rng_video.addEventListener("change", function() {

						subtitles_entrer = false;
						document.getElementsByClassName("vSubtitles")[0].innerHTML = "";

						_video.currentTime = parseFloat((_video.duration * rng_video.value) / 100).toFixed(1);
						_video.play();
					}, false);
					// Progress Bar
					
					var _progress_start = 0;
					var _progress_end = 0;
					
					var subtitles_entrer = false;
					var subtitles_entrer_pos = 0;

					_video.ontimeupdate = function() {
						try{
							var _progress = ((_video.currentTime * 100)/_video.duration);
							try{ rng_video.value = parseFloat(_progress).toFixed(1); }catch(e){}
							document.getElementById("htm_video_time_part").innerHTML = getHumanTime(_video.currentTime);	
							
							_timer_end = _video.currentTime;
						}catch(e){}

						if( subtitle_time_start.length > 0 ){

							if( ( subtitle_time_end.indexOf( parseInt(_video.currentTime) ) >= 0 ) ){			
								document.getElementsByClassName("vSubtitles")[0].innerHTML = "";
								subtitles_entrer = false;
							}
							
							if( subtitle_time_start.indexOf( parseInt(_video.currentTime) ) >= 0 ){
								
								document.getElementsByClassName("vSubtitles")[0].innerHTML = subtitle_ar[ subtitle_time_start.indexOf( parseInt(_video.currentTime) ) ];
			
								subtitles_entrer = true;
								subtitles_entrer_pos = subtitle_time_start.indexOf( parseInt(_video.currentTime) );
							}
							
							if( subtitles_entrer ){
								try{
									document.getElementsByClassName("vSubtitles")[0].innerHTML = subtitle_ar[ subtitles_entrer_pos ];
								}catch(e){}
							}			
						}
					};
					
					_video.onended = function() {
						document.getElementById("htm_video_control_play").classList.remove("htm_video_control_hide");
						document.getElementById("htm_video_control_pause").classList.add("htm_video_control_hide");
					};
					_video.onplay = function() {						
						document.getElementById("htm_video_control_pause").classList.remove("htm_video_control_hide");
						document.getElementById("htm_video_control_play").classList.add("htm_video_control_hide");	
	
						_timer_start = _video.currentTime;
						_timer_end = _video.currentTime;
					};
					_video.onpause = function() {
						try{							
							document.getElementById("htm_video_control_play").classList.remove("htm_video_control_hide");
						}catch(e){}
						try{							
							document.getElementById("htm_video_control_pause").classList.add("htm_video_control_hide");
						}catch(e){}
	
						_timer_start = _video.currentTime;
						_timer_end = _video.currentTime;
					};
					
					// Eventos
					
					// Play
					document.getElementById('htm_video_control_play').onclick = function(){
						_video.play();
					}
					
					// Pause
					document.getElementById('htm_video_control_pause').onclick = function(){
						_video.pause();				
					}
					
					// Mutear
					document.getElementById('htm_video_control_volume').onclick = function(){
						_video.muted = true;				
						document.getElementById("htm_video_control_mute").classList.remove("htm_video_control_hide");
						document.getElementById("htm_video_control_volume").classList.add("htm_video_control_hide");
					}
					
					// Desmutear
					document.getElementById('htm_video_control_mute').onclick = function(){
						_video.muted = false;
						document.getElementById("htm_video_control_volume").classList.remove("htm_video_control_hide");
						document.getElementById("htm_video_control_mute").classList.add("htm_video_control_hide");
					}
					
					// Fullscreen
					document.getElementById('htm_video_control_fullscreen').onclick = function(){						
						var _pop = document.getElementById('htm_video_source');
						if (_pop.requestFullscreen) {
							_pop.requestFullscreen();
						} else if (_pop.mozRequestFullScreen) {
							_pop.mozRequestFullScreen();
						} else if (_pop.webkitRequestFullscreen) {
							_pop.webkitRequestFullscreen();
						} else if (_pop.msRequestFullscreen) {
							_pop.msRequestFullscreen();
						}
					}
					
					// Restore Fullscreen
					document.getElementById('htm_video_control_restorescreen').onclick = function(){
						console.log('htm_video_control_restorescreen');
					}
					
					// Cerrar Modal
					document.getElementById('htm_video_close').onclick = function(){
						sendTraceEnd();
						var pre_element = document.getElementById('hotspot-tron-modal');
						pre_element.parentNode.removeChild(pre_element);
					}
					
					//document.getElementById('htm_video_controls').onmouseleave = function(){}
					
					document.getElementById('htm_video_controls').onmouseenter = function(){
						_control_interval = 0;
						try{
							var elements = document.getElementById("htm_video_controls").querySelectorAll('div');
							for(var __i = 0; __i < elements.length; __i++) {
								elements[__i].classList.remove('htm_video_all_control_hide');
							}
						}catch(e){}
					}
					document.getElementById('htm_video_controls').onmousemove = function(){
						_control_interval = 0;
						try{
							var elements = document.getElementById("htm_video_controls").querySelectorAll('div');
							for(var __i = 0; __i < elements.length; __i++) {
								elements[__i].classList.remove('htm_video_all_control_hide');
							}
						}catch(e){}
					}
					
					var _control_interval = 0;
					var _interval;
					var _interval = setInterval(function(){
						if(document.querySelectorAll("#htm_video_controls").length == 0){
							clearInterval(_interval);
							return;
						}						
						_control_interval++;						
						if(_control_interval >= 5){							
							try{
								var elements = document.getElementById("htm_video_controls").querySelectorAll('div');
								for(var __i = 0; __i < elements.length; __i++) {
									elements[__i].classList.add('htm_video_all_control_hide');
								}
							}catch(e){}
						}
					}, 1000);
					
				}
				break;
				case 'htmlLink':{
				
					// Si la url no contiene index.html
					try{ if( _data.url.indexOf('index.html') == -1 ){ errorLoadHotspotMedia(); return; } }catch(e){}
					
					var _htmlplayer = 	'<div id="htm_oed_close"></div>'+
										'<iframe id="htm_oed_source" src="'+_data.url+'"></iframe>';
										
					var _inner_oed = document.createElement("div");
					_inner_oed.id = "htm_oed_wrap";
					_inner_oed.classList.add("htm_element_wrap_hidden");
					_inner_oed.innerHTML = _htmlplayer;
					
					document.getElementById('hotspot-tron-modal').appendChild(_inner_oed);
					
					var _oed = document.getElementById("htm_oed_source");
					
					var _is_error = false;

					/*const xhr = new XMLHttpRequest();
					xhr.open('HEAD', _data.url, true);
					xhr.send();
					xhr.onreadystatechange = function(e) { 
						if(xhr.readyState == 4){
							if( (xhr.status != 200) && (xhr.status != 206) && (xhr.status != 0) ){							
								_is_error = true; 
							}
						} 
					}*/
					
					_oed.onload = function() {
						try{
							if( !_is_error ){	
								hideLoadingHotspot(document.getElementById("htm_oed_wrap"), 1, 'html_interactive');
							}else{
								errorLoadHotspotMedia();								
							}
						}catch(e){
							errorLoadHotspotMedia();
						}
					};
					
					// Cerrar Modal
					document.getElementById('htm_oed_close').onclick = function(){
						sendTraceEnd();
						var pre_element = document.getElementById('hotspot-tron-modal');
						pre_element.parentNode.removeChild(pre_element);
					}
					
					_timer_start = 0;
					_timer_end = 1;
					
				}
				break;
				case 'urlLink':{					
					try{						
						var pre_element = document.getElementById('hotspot-tron-modal');
						pre_element.parentNode.removeChild(pre_element);
					}catch(rer){}
					//hideLoadingHotspot('', '', 'url');
					window.open(_data.url, '_blank');
				}
				break;
				default:
					console.log ('NO DEFINIDO: ' + _guid);
				break;
			}

		//}, 1000);
		
	}
	
	function getHumanTime(_time){		
		var minutes = Math.floor(_time / 60);
		var secs = Math.floor(_time % 60);
		if (minutes < 10) { minutes = '0' + minutes; }
		if (secs < 10) { secs = '0' + secs; }
		return minutes +  ':' + secs;		
	}
	
	function loadExternalLang(){
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["apply"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_APPLY || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["apply"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["applyAll"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_APPLYALL || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["applyAll"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["cancel"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_CANCEL || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["cancel"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["clear"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_CLEAR || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["clear"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["close"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_CLOSE || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["close"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["comment"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_COMMENT || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["comment"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["copy"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_COPY || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["copy"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["delete"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_DELETE || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["delete"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["download"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_DOWNLOAD || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["download"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["edit"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_EDIT || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["edit"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["enterFullscreen"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ENTERFULLSCREEN || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["enterFullscreen"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["exitFullscreen"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_EXITFULLSCREEN || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["exitFullscreen"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["fit"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_FIT || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["fit"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["fitToPage"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_FITTOPAGE || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["fitToPage"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["fitToWidth"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_FITTOWIDTH || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["fitToWidth"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["openFile"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_OPENFILE || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["openFile"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["print"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PRINT || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["print"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["ok"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_OK || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["ok"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["reply"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_REPLY || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["reply"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["rotate"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ROTATE || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["rotate"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["rotateClockwise"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ROTATECLOCKWISE || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["rotateClockwise"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["rotateCounterClockwise"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ROTATECOUNTERCLOCKWISE || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["rotateCounterClockwise"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["save"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SAVE || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["save"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["create"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_CREATE || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["create"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["showMoreResults"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHOWMORERESULTS || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["showMoreResults"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["saveSignature"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SAVESIGNATURE || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["saveSignature"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["sign"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SIGN || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["sign"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["style"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_STYLE || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["style"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["submit"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SUBMIT || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["submit"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["zoom"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ZOOM || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["zoom"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["zoomIn"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ZOOMIN || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["zoomIn"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["zoomOut"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ZOOMOUT || instancePdfTron.i18n.store.data["pt"]["translation"]["action"]["zoomOut"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["areaMeasurement"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_AREAMEASUREMENT || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["areaMeasurement"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["arrow"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ARROW || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["arrow"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["callout"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_CALLOUT || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["callout"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["caret"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_CARET || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["caret"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["distanceMeasurement"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_DISTANCEMEASUREMENT || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["distanceMeasurement"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["ellipse"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ELLIPSE || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["ellipse"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["freehand"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_FREEHAND || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["freehand"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["freehand2"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_FREEHAND2 || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["freehand2"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["freetext"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_FREETEXT || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["freetext"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["freetext2"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_FREETEXT2 || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["freetext2"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["highlight"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_HIGHLIGHT || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["highlight"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["highlight2"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_HIGHLIGHT2 || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["highlight2"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["line"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_LINE || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["line"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["perimeterMeasurement"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PERIMETERMEASUREMENT || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["perimeterMeasurement"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["polygon"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_POLYGON || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["polygon"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["polygonCloud"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_POLYGONCLOUD || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["polygonCloud"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["polyline"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_POLYLINE || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["polyline"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["rectangle"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_RECTANGLE || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["rectangle"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["redact"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_REDACT || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["redact"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["signature"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SIGNATURE || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["signature"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["squiggly"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SQUIGGLY || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["squiggly"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["stamp"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_STAMP || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["stamp"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["stickyNote"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_STICKYNOTE || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["stickyNote"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["strikeout"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_STRIKEOUT || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["strikeout"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["underline"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_UNDERLINE || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["underline"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["custom"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_CUSTOM || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["custom"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["custom_conteudo_especial"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_CUSTOM_CONTEUDO_ESPECIAL || instancePdfTron.i18n.store.data["pt"]["translation"]["annotation"]["custom_conteudo_especial"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["freehandToolsButton"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_FREEHANDTOOLSBUTTON || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["freehandToolsButton"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["leftPanel"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_LEFTPANEL || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["leftPanel"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["searchOverlay"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SEARCHOVERLAY || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["searchOverlay"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["menuOverlay"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MENUOVERLAY || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["menuOverlay"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["miscToolsButton"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MISCTOOLSBUTTON || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["miscToolsButton"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["notesPanel"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_NOTESPANEL || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["notesPanel"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["outlinesPanel"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_OUTLINESPANEL || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["outlinesPanel"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["shapeToolsButton"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHAPETOOLSBUTTON || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["shapeToolsButton"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["shapeToolsButton"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHAPETOOLSBUTTON || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["shapeToolsButton"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["textToolsButton"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_TEXTTOOLSBUTTON || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["textToolsButton"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["thumbnailsPanel"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_THUMBNAILSPANEL || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["thumbnailsPanel"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["toolsButton"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_TOOLSBUTTON || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["toolsButton"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["redaction"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_REDACTION || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["redaction"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["viewControlsOverlay"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_VIEWCONTROLSOVERLAY || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["viewControlsOverlay"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["measurementToolsButton"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MEASUREMENTTOOLSBUTTON || instancePdfTron.i18n.store.data["pt"]["translation"]["component"]["measurementToolsButton"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["badDocument"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_BADDOCUMENT || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["badDocument"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["customPrintPlaceholder"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_CUSTOMPRINTPLACEHOLDER || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["customPrintPlaceholder"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["encryptedAttemptsExceeded"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ENCRYPTEDATTEMPTSEXCEEDED || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["encryptedAttemptsExceeded"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["encryptedUserCancelled"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ENCRYPTEDUSERCANCELLED || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["encryptedUserCancelled"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["enterPassword"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ENTERPASSWORD || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["enterPassword"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["incorrectPassword"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_INCORRECTPASSWORD || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["incorrectPassword"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["noAnnotations"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_NOANNOTATIONS || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["noAnnotations"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["noOutlines"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_NOOUTLINES || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["noOutlines"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["noResults"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_NORESULTS || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["noResults"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["notSupported"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_NOTSUPPORTED || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["notSupported"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["passwordRequired"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PASSWORDREQUIRED || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["passwordRequired"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["preparingToPrint"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PREPARINGTOPRINT || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["preparingToPrint"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["printTotalPageCount"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PRINTTOTALPAGECOUNT || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["printTotalPageCount"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["printTotalPageCount_plural"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PRINTTOTALPAGECOUNT_PLURAL || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["printTotalPageCount_plural"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["processing"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PROCESSING || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["processing"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["searching"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SEARCHING || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["searching"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["searchPlaceholder"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SEARCHPLACEHOLDER || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["searchPlaceholder"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["signHere"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SIGNHERE || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["signHere"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["insertTextHere"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_INSERTTEXTHERE || instancePdfTron.i18n.store.data["pt"]["translation"]["message"]["insertTextHere"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["annotationColor"]["StrokeColor"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ANNOTATIONCOLOR_STROKECOLOR || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["annotationColor"]["StrokeColor"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["annotationColor"]["FillColor"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ANNOTATIONCOLOR_FILLCOLOR || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["annotationColor"]["FillColor"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["annotationColor"]["TextColor"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_ANNOTATIONCOLOR_TEXTCOLOR || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["annotationColor"]["TextColor"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["displayMode"]["layout"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_DISPLAYMODE_LAYOUT || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["displayMode"]["layout"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["displayMode"]["pageTransition"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_DISPLAYMODE_PAGETRANSITION || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["displayMode"]["pageTransition"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["layout"]["cover"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_LAYOUT_COVER || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["layout"]["cover"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["layout"]["double"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_LAYOUT_DOUBLE || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["layout"]["double"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["layout"]["single"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_LAYOUT_SINGLE || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["layout"]["single"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["notesPanel"]["orderPosition"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_NOTESPANEL_ORDERPOSITION || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["notesPanel"]["orderPosition"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["notesPanel"]["orderTime"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_NOTESPANEL_ORDERTIME || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["notesPanel"]["orderTime"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["notesPanel"]["separator"]["today"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_NOTESPANEL_SEPARATOR_TODAY || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["notesPanel"]["separator"]["today"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["notesPanel"]["separator"]["yesterday"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_NOTESPANEL_SEPARATOR_YESTERDAY || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["notesPanel"]["separator"]["yesterday"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["pageTransition"]["continuous"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PAGETRANSITION_CONTINUOUS || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["pageTransition"]["continuous"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["pageTransition"]["default"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PAGETRANSITION_DEFAULT || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["pageTransition"]["default"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["print"]["all"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PRINT_ALL || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["print"]["all"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["print"]["current"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PRINT_CURRENT || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["print"]["current"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["print"]["pages"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PRINT_PAGES || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["print"]["pages"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["print"]["includeComments"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_PRINT_INCLUDECOMMENTS || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["print"]["includeComments"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["redaction"]["markForRedaction"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_REDACTION_MARKFORREDACTION || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["redaction"]["markForRedaction"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["redaction"]["warningPopupMessage"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_REDACTION_WARNINGPOPUPMESSAGE || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["redaction"]["warningPopupMessage"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["redaction"]["warningPopupTitle"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_REDACTION_WARNINGPOPUPTITLE || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["redaction"]["warningPopupTitle"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["searchPanel"]["caseSensitive"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SEARCHPANEL_CASESENSITIVE || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["searchPanel"]["caseSensitive"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["searchPanel"]["wholeWordOnly"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SEARCHPANEL_WHOLEWORDONLY || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["searchPanel"]["wholeWordOnly"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["signatureOverlay"]["addSignature"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SIGNATUREOVERLAY_ADDSIGNATURE || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["signatureOverlay"]["addSignature"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["scale"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MEASUREMENTOVERLAY_SCALE || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["scale"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["angle"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MEASUREMENTOVERLAY_ANGLE || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["angle"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["distance"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MEASUREMENTOVERLAY_DISTANCE || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["distance"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["perimeter"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MEASUREMENTOVERLAY_PERIMETER || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["perimeter"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["area"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MEASUREMENTOVERLAY_AREA || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["area"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["distanceMeasurement"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MEASUREMENTOVERLAY_DISTANCEMEASUREMENT || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["distanceMeasurement"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["perimeterMeasurement"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MEASUREMENTOVERLAY_PERIMETERMEASUREMENT || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["perimeterMeasurement"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["areaMeasurement"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MEASUREMENTOVERLAY_AREAMEASUREMENT || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOverlay"]["areaMeasurement"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOption"]["scale"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_MEASUREMENTOPTION_SCALE || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["measurementOption"]["scale"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["slider"]["opacity"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SLIDER_OPACITY || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["slider"]["opacity"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["slider"]["thickness"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SLIDER_THICKNESS || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["slider"]["thickness"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["slider"]["text"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SLIDER_TEXT || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["slider"]["text"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["shared"]["page"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHARED_PAGE || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["shared"]["page"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["shared"]["precision"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHARED_PRECISION || instancePdfTron.i18n.store.data["pt"]["translation"]["option"]["shared"]["precision"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["arrow"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_ARROW || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["arrow"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["callout"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_CALLOUT || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["callout"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["copy"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_COPY || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["copy"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["delete"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_DELETE || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["delete"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["ellipse"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_ELLIPSE || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["ellipse"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["freehand"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_FREEHAND || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["freehand"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["freetext"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_FREETEXT || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["freetext"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["highlight"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_HIGHLIGHT || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["highlight"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["line"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_LINE || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["line"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["pan"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_PAN || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["pan"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["rectangle"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_RECTANGLE || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["rectangle"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["rotateClockwise"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_ROTATECLOCKWISE || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["rotateClockwise"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["rotateCounterClockwise"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_ROTATECOUNTERCLOCKWISE || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["rotateCounterClockwise"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["select"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_SELECT || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["select"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["signature"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_SIGNATURE || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["signature"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["squiggly"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_SQUIGGLY || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["squiggly"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["stamp"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_STAMP || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["stamp"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["stickyNote"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_STICKYNOTE || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["stickyNote"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["strikeout"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_STRIKEOUT || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["strikeout"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["underline"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_UNDERLINE || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["underline"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["zoomIn"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_ZOOMIN || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["zoomIn"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["zoomOut"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_SHORTCUT_ZOOMOUT || instancePdfTron.i18n.store.data["pt"]["translation"]["shortcut"]["zoomOut"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["tool"]["pan"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_TOOL_PAN || instancePdfTron.i18n.store.data["pt"]["translation"]["tool"]["pan"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["tool"]["select"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_TOOL_SELECT || instancePdfTron.i18n.store.data["pt"]["translation"]["tool"]["select"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["tool"]["Marquee"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_TOOL_MARQUEE || instancePdfTron.i18n.store.data["pt"]["translation"]["tool"]["Marquee"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["tool"]["drawing"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_TOOL_DRAWING || instancePdfTron.i18n.store.data["pt"]["translation"]["tool"]["drawing"]; }catch(e){}
		try{ instancePdfTron.i18n.store.data["pt"]["translation"]["tool"]["underline"] = LANG_LIBRARY.VISOR_LIB_PDFTRON_TOOL_UNDERLINE || instancePdfTron.i18n.store.data["pt"]["translation"]["tool"]["underline"]; }catch(e){}
	}
}


// Inital method to call to apply PanZoom to elements given a selector
function PanZoom(selector, opts) {
  let panZoomEles = []
  opts = opts || {};
  let minScale = (opts.minScale ? opts.minScale : 0.1);
  let maxScale = (opts.maxScale ? opts.maxScale : 5);
  let increment = (opts.increment ? opts.increment  : 0.05);
  let liner = (opts.liner ? opts.liner  : false);
  document.querySelectorAll(selector).forEach(function(ele){
    panZoomEles.push(new AttachPanZoom(ele, minScale , maxScale, increment, liner));
  });
  if(panZoomEles.length == 1)
    return panZoomEles[0];
  return panZoomEles;
}

// Appy PanZoom functionality to a given element, allow user defined zoom min and inc per scroll
function AttachPanZoom(ele, minScale, maxScale, increment, liner) {
  this.increment = increment;
  this.minScale = minScale;
  this.maxScale = maxScale;
  this.liner = liner;
  this.panning = false;
  this.oldX = this.oldY = 0;
  let self = this;
  ele.style.transform = "matrix(1, 0, 0, 1, 0, 0)";
  
  // Gets the current Scale, along with transX and transY
  this.getTransformMatrix = function() {
    let trans = ele.style.transform;
    let start = trans.indexOf("(") + 1;
    let end = trans.indexOf(")");
    let matrix = trans.slice(start, end).split(",");
    return { 
      "scale": +matrix[0], 
      "transX": +matrix[4], 
      "transY": +matrix[5] 
    }
  }

  // Given the scale, translateX and translateY apply to CSSS transform
  this.setTransformMatrix = function(o) {
    ele.style.transform = 'matrix('+o.scale+', 0, 0, '+o.scale+', '+o.transX+', '+o.transY+')';
  }

  this.applyTranslate = function(dx, dy){
    let newTrans = this.getTransformMatrix();
    newTrans.transX += dx;
    newTrans.transY += dy;
    this.setTransformMatrix(newTrans);
  } 

  // Applying Deltas to Scale and Translate transformations
  this.applyScale = function(dscale, x, y){
    let newTrans = this.getTransformMatrix();
    let width = ele.width ? ele.width : ele.offsetWidth;
    let height = ele.height ? ele.height : ele.offsetHeight;
    let tranX = x - (width / 2);
    let tranY = y - (height / 2);
    dscale = (this.liner ? dscale : dscale * (newTrans.scale)) // scale either liner or non-liner 
    newTrans.scale += dscale;
    let maxOrMinScale = (newTrans.scale <= this.minScale || newTrans.scale >= this.maxScale);
    if(newTrans.scale < this.minScale) newTrans.scale = this.minScale;
    if(newTrans.scale > this.maxScale) newTrans.scale = this.maxScale;
    if(!maxOrMinScale) {
      this.applyTranslate(tranX, tranY);
      this.setTransformMatrix(newTrans);
      this.applyTranslate(-(tranX * dscale), -(tranY * dscale));
    }
  }

  // Capture when the mouse is down on the element or not
  ele.addEventListener("mousedown", function(e) {
    e.preventDefault();
    this.panning = true;
    this.oldX = e.clientX;
    this.oldY = e.clientY;
  });
  
  ele.addEventListener("mouseup", function(e) { this.panning = false; });
  ele.addEventListener("mouseleave", function(e) { this.panning = false; });

  ele.addEventListener("mousemove", function(e){
    if(this.panning) {
      let deltaX = e.clientX - this.oldX;
      let deltaY = e.clientY - this.oldY;
      self.applyTranslate(deltaX, deltaY);
      this.oldX = e.clientX;
      this.oldY = e.clientY;
    }
  });

  this.getScrollDirection = function(e){
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    if(delta < 0)
      self.applyScale(-self.increment, e.offsetX, e.offsetY)
    else
      self.applyScale(self.increment, e.offsetX, e.offsetY);
  }

  ele.addEventListener('DOMMouseScroll',this.getScrollDirection,false);
  
  ele.addEventListener('mousewheel',this.getScrollDirection,false); 
  
  document.getElementById('htm_image_zoomin').addEventListener('click',function(){
	self.applyScale(self.increment,(window.innerWidth / 2), (window.innerHeight / 2));
  }); 
  
  document.getElementById('htm_image_zoomout').addEventListener('click',function(){	
	self.applyScale(-self.increment,(window.innerWidth / 2), (window.innerHeight / 2));
  }); 

}
