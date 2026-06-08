import { ChangeDetectionStrategy, Component, effect, inject, OnInit, output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ECategory } from '../../../enum/category';
import { validateUpdateProductSchema } from '../../../schemas/create-product-schema';
import { ProductService } from '../services/product/product-service';
import { AccountProductsService } from '../../account/account-products/account-products-service';

@Component({
  selector: 'app-product-update',
  imports: [ReactiveFormsModule], 
  templateUrl: './update.html',
  styleUrl: './update.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductUpdate implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly accountProductsService = inject(AccountProductsService);
  
  private fb = inject(FormBuilder);
  protected productForm!: FormGroup;
  protected categories = Object.values(ECategory);

  onReturn = output<void>();

  constructor(){
    effect(() => {
      const product = this.productService.state().data;
      if(!product){
        this.onReturn.emit();
      };
    });
  };

  get tagsArray(): FormArray {
    return this.productForm.get('tags') as FormArray;
  }

  get imagesArray(): FormArray {
    return this.productForm.get('images') as FormArray;
  }

  ngOnInit(){
    const product = this.productService.state().data!;
    this.productForm = this.fb.group({
      title: [product.title, [Validators.minLength(4), Validators.maxLength(250)]],
      description: [product.description, []],
      category: [product.category, []],
      price: [product.price, [Validators.min(0)]],
      discountPercentage: [product.discountPercentage, [Validators.min(0)]], 
      stock: [product.stock, [Validators.min(0)]],
      brand: [product.brand, [Validators.maxLength(100)]],
      weight: [product.weight, [Validators.min(0)]],
      physical: [product.physical, []],
      warrantyInfo: [product.warrantyInfo, [Validators.maxLength(250)]],
      shippingInfo: [product.shippingInfo, [Validators.maxLength(250)]],
      tags: this.fb.array(product.tags?.map(t => this.fb.control(t)) || []),
      images: this.fb.array(product.images?.map(i => this.fb.control(i)) || []), 
      thumbnail: [product.thumbnail, [Validators.maxLength(500)]]
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
      // Manejo de errores de Valibot
    } else {
      const response = await this.accountProductsService.updateProduct(result.output, product.id);
      if(!response){
        this.onReturn.emit();
      };
    }
  }

  onCancel() {
    this.onReturn.emit();
  }
}
