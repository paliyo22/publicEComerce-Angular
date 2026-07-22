import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreService } from './store-service';
import { validateNewStoreSchema } from '../../../schemas/create-account-schema';
import { AlertService } from '../../alert-component/alert-service';

@Component({
  selector: 'app-store',
  imports: [ReactiveFormsModule],
  templateUrl: './store.html',
  styleUrl: './store.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Store implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly alertService = inject(AlertService);
  protected readonly storeState = this.storeService.state;
  protected processing = signal(new Set<string>());
  
  private readonly fb = inject(FormBuilder);
  protected storeForm!: FormGroup;

  onClose = output();

  addToSignal(id: string){
    this.processing.update((set) => new Set(set).add(id));
  }

  deleteFromSignal(id: string){
    this.processing.update((set) => {
      const newSet = new Set(set);
      newSet.delete(id);
      return newSet;
    });
  }

  initForms() {
    this.storeForm = this.fb.group({
      address: ['', [Validators.required, Validators.maxLength(100)]],
      apartment: ['', Validators.maxLength(10)],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      zip: ['', [Validators.required, Validators.maxLength(10)]],
      country: ['', [Validators.required, Validators.maxLength(100)]],
      phone: ['', [Validators.maxLength(50)]]
    });
  }

  ngOnInit(){
    this.initForms();
    this.storeService.getStoreList();
  };

  async onDelete(storeId: string){
    this.addToSignal(storeId);
    const result = await this.storeService.deleteStore(storeId);
    if(result){
      this.errorManager('eliminar la tienda.', result);
    };
    this.deleteFromSignal(storeId);
    this.alertService.setAlert('Eliminada.', 'success');
  }

  async onConfirm(){
    if(this.storeForm.invalid) return;
    
    const result = validateNewStoreSchema(this.storeForm.value);

    if(!result.success){
      this.alertService.setAlert('Error al procesar la informacion, contactá a soporte técnico.', 'error');
    }else {
      const response = await this.storeService.addStore(result.output);
      if(response){
        this.initForms();
      };
    };
  };

  onRetry(){ 
    if(this.storeState().data){
      this.storeService.cleanError();
    }else{
      this.storeService.getStoreList();
    };
  };

  onBack(){
    this.onClose.emit();
  };

  errorManager(action: string, error: string){
    let message: string;
    switch(error){
      case 'TIMEOUT':
        message = 'Error al obtener el resultado. Actualice la pagina e intente nuevamente.';
        break;
      case 'UNAVAILABLE':
        message = 'Actualmente estamos realizando mantenimiento, aguarde unos minutos y vuelva a intentarlo.';
        break;
      case 'INTERNAL_ERROR':
        message = 'Ups! Parece que algo ha fallado, vuelva a intentar. Si el error persiste contacte con soporte.';
        break;
      case 'NOT_FOUND':
        message = 'Ah ocurrido un error grave, recargue la pagina y reintente. Si el error persiste contacte con soporte.';
        break;
      case 'BAD_REQUEST':
        message = 'No se puede realizar esta accion.';
        break;
      case 'PARSE_ERROR':
        message = 'Error al procesar la informacion, contactá a soporte técnico.';
        break;
      case 'NETWORK_ERROR':
        message = 'Error de coneccion. Checke su conneccion a internet y reintente.';
        break;
      default:
        message = 'Error al ' + action;
        break;
    };
    this.alertService.setAlert(message, 'error');
  }
}
