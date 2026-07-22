import { ChangeDetectionStrategy, Component, effect, inject, input, output, untracked } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ECategory } from '../../../enum/category';
import { validateUpdateProductSchema } from '../../../schemas/create-product-schema';
import { ProductService } from '../services/product/product-service';
import { AccountProductsService } from '../../account/account-products/account-products-service';
import { AlertService } from '../../alert-component/alert-service';

@Component({
  selector: 'app-product-update',
  imports: [ReactiveFormsModule], 
  templateUrl: './update.html',
  styleUrl: './update.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductUpdate {
  private readonly productService = inject(ProductService);
  private readonly accountProductsService = inject(AccountProductsService);
  private readonly alertService = inject(AlertService);
  protected productState = this.productService.state;
  
  private fb = inject(FormBuilder);
  protected productForm!: FormGroup;
  protected categories = Object.values(ECategory);
  private initial = true;

  productId = input<string>();
  onReturn = output();

  constructor(){
    effect(() => {
      const id = this.productId();
      if(id){
        untracked(() => this.productService.getProduct(id));
      };
    });

    effect(() => {
      const product = this.productState();
      if(product.error && !product.data){
        untracked(() => this.onReturn.emit());
        return;
      };

      if(product.data && this.initial){
        untracked(() => this.initForms());
        this.initial = false;
      };
    });
  };

  get tagsArray(): FormArray {
    return this.productForm.get('tags') as FormArray;
  }

  get imagesArray(): FormArray {
    return this.productForm.get('images') as FormArray;
  }

  initForms(){
    const product = this.productService.state().data!;
    this.productForm = this.fb.group({
      title: [product.title, [Validators.minLength(4), Validators.maxLength(250)]],
      description: [product.description, []],
      category: [product.category, []],
      price: [product.price, [Validators.min(0)]],
      discountPercentage: [product.discountPercentage, [Validators.min(0)]], 
      stock: [product.stock, [Validators.min(0)]],
      brand: [product.brand ?? '', [Validators.maxLength(100)]],
      weight: [product.weight, [Validators.min(0)]],
      physical: [product.physical, []],
      warrantyInfo: [product.warrantyInfo ?? '', [Validators.maxLength(250)]],
      shippingInfo: [product.shippingInfo ?? '', [Validators.maxLength(250)]],
      tags: this.fb.array(product.tags?.map(t => this.fb.control(t)) || []),
      images: this.fb.array(product.images?.map(i => this.fb.control(i)) || []), 
      thumbnail: [product.thumbnail ?? '', [Validators.maxLength(500)]]
    });
  }

  addTag(): void {
    this.tagsArray.push(this.fb.control('', [Validators.required]));
  }

  addImage(): void {
    this.imagesArray.push(this.fb.control('', [Validators.required, Validators.maxLength(500)]));
  }

  removeTag(index: number): void {
    this.tagsArray.removeAt(index);
    this.productForm.markAsDirty();
  }

  removeImage(index: number): void {
    this.imagesArray.removeAt(index);
    this.productForm.markAsDirty();
  }

  async onSubmit() {
    const product = this.productService.state().data!;
    if (this.productForm.invalid) return;
    const result = validateUpdateProductSchema(this.productForm.value);

    if (!result.success) {
      this.alertService.setAlert('Error al procesar la informacion, contactá a soporte técnico.', 'error');
    } else {
      const response = await this.accountProductsService.updateProduct(result.output, product.id);
      if(!response){
        this.onReturn.emit();
      }else{
        this.errorManager(response);
      }
    }
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
