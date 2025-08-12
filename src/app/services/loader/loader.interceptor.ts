import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpResponse, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators';
import { LoaderService } from './loader.service';

let activeRequests = 0;


const loadingMessages: { [key: string]: string } = {
  '/medicinesRequired': 'Cargando medicinas requeridas...',
  '/medicines': 'Cargando medicinas...',
  '/clients': 'Cargando clientes...',
  '/doctors': 'Cargando médicos...',
  '/diagnostics': 'Cargando diagnósticos...',
  '/users': 'Cargando usuarios...',
  'POST': 'Guardando información...',
  'PUT': 'Actualizando información...',
  'DELETE': 'Eliminando registro...'
};

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  
  activeRequests++;
  

  const message = getLoadingMessage(req);
  
  if (activeRequests === 1) {
    loaderService.show(message);
  } else {
    loaderService.updateMessage(message);
  }

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          loaderService.updateMessage('Completado');
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error en la petición HTTP:', error);
        loaderService.updateMessage('Error en la solicitud');
      }
    }),
    finalize(() => {
      activeRequests--;
      
      if (activeRequests === 0) {
        setTimeout(() => {
          loaderService.hide();
        }, 200);
      }
    })
  );
};

function getLoadingMessage(req: HttpRequest<any>): string {
  for (const [path, message] of Object.entries(loadingMessages)) {
    if (req.url.includes(path) && path !== 'POST' && path !== 'PUT' && path !== 'DELETE') {
      return message;
    }
  }

  if (loadingMessages[req.method]) {
    return loadingMessages[req.method];
  }


  return 'Procesando solicitud...';
}
