import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../account/services/auth/auth-service';
import { ProductService } from '../services/product/product-service';
import { RouterLink } from "@angular/router";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-reviews',
  imports: [
    ReactiveFormsModule, RouterLink, 
    CommonModule
  ],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductReviews {
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  protected productState = this.productService.state;
  protected authState = this.authService.state;

  private fb = inject(FormBuilder);
  protected reviewForm!: FormGroup;

   protected userReview = computed(() => {
    const user = this.authState().data;
    const list = this.productState().data!.reviews || [];
    if (!user) return null;
    return list.find((rev) => rev.username === user.username) || null;
  });

  constructor(){
    effect(() => {
      const isLogged = this.authState().data;
      if(isLogged){
        this.initForm();   
      };
    })
  };

  initForm(){
    this.reviewForm = this.fb.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(10)]],
      comment: ['', Validators.maxLength(1000)]
    });
  };

  onSubmit(){
    if(this.reviewForm.invalid) return;
    this.productService.addReview(this.reviewForm.value);
  };

  onDelete(){
    this.productService.deleteReview(this.authState().data!.username);
  };
}
