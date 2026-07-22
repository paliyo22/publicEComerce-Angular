import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ECategory } from '../../../enum/category';
import { validateNewProduct } from '../../../schemas/create-product-schema';
import { AccountProductsService } from '../../account/account-products/account-products-service';
import { AlertService } from '../../alert-component/alert-service';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create.html',
  styleUrl: './create.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCreate implements OnInit {
  private readonly accountProductsService = inject(AccountProductsService);
  private readonly alertService = inject(AlertService);
  private readonly fb = inject(FormBuilder);

  protected productForm!: FormGroup;
  protected categories = Object.values(ECategory);

  protected loading = signal(false);
  onReturn = output<void>();

  ngOnInit(): void {
    this.productForm = this.fb.group({
      title: ["", [Validators.required, Validators.minLength(4), Validators.maxLength(250)]],
      description: ["", [Validators.required]],
      category: [null, [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0)]], 
      stock: [0, [Validators.required, Validators.min(0)]],
      brand: ["", [Validators.maxLength(100)]],
      weight: [0, [Validators.required, Validators.min(0)]],
      physical: [true, [Validators.required]],
      warrantyInfo: ["", [Validators.maxLength(250)]],
      shippingInfo: ["", [Validators.maxLength(250)]],
      tags: [[]],
      images: [[]], 
      thumbnail: ["", [Validators.maxLength(500)]]
    });
  }

  async onSubmit() {
    if (this.productForm.invalid) return;
    this.loading.set(true);
    const result = validateNewProduct(this.productForm.value);

    if (!result.success) {
      this.alertService.setAlert('Error al procesar la informacion, contactá a soporte técnico.', 'error');
    }else{
      const response = await this.accountProductsService.createProduct(result.output);
      if(!response.error){
        this.onReturn.emit();
        return;
      }else{
        this.errorManager(response.data);
      }; 
    };
    this.loading.set(false);
  }

  addTag(input: HTMLInputElement) {
    const value = input.value.trim();
    const currentTags = this.productForm.get('tags')?.value as string[] || [];
    
    if (value && currentTags.length < 30 && !currentTags.includes(value)) {
      this.productForm.patchValue({ tags: [...currentTags, value] });
      this.productForm.get('tags')?.markAsDirty();
      input.value = '';
    }
  }

  addImage(input: HTMLInputElement) {
    const value = input.value.trim();
    const currentImgs = this.productForm.get('images')?.value as string[] || [];
    
    if (value && currentImgs.length < 30 && !currentImgs.includes(value)) {
      this.productForm.patchValue({ images: [...currentImgs, value] });
      this.productForm.get('images')?.markAsDirty();
      input.value = '';
    }
  }

  removeItem(controlName: 'tags' | 'images', index: number) {
    const currentValues = this.productForm.get(controlName)?.value as string[];
    if (!currentValues) return;

    const updatedValues = currentValues.filter((_, i) => i !== index);
    
    this.productForm.patchValue({ [controlName]: updatedValues });
    this.productForm.get(controlName)?.markAsDirty();
  }

  onCancel() {
    this.onReturn.emit();
  }

  errorManager(error: string){
    let message: string;
    switch(error){
      case 'TIMEOUT':
        message = 'Error al obtener el resultado. Actualice la pagina.';
        break;
      case 'UNAVAILABLE':
        message = 'Actualmente estamos realizando mantenimiento, aguarde unos minutos y vuelva a intentarlo.';
        break;
      case 'INTERNAL_ERROR':
        message = 'Ups! Parece que algo ha fallado, vuelva a intentar. Si el error persiste contacte con soporte.';
        break;
      case 'NOT_FOUND':
        message = 'Categoría invalida';
        break;
      case 'NETWORK_ERROR':
        message = 'Error de coneccion. Checke su conneccion a internet y reintente.';
        break;
      default:
        message = 'Ups! Parece que algo ha fallado, vuelva a intentar.';
        break;
    }
    this.alertService.setAlert(message, 'error');
  }
}