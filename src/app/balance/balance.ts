import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { BalanceService } from './services/balance-service';
import { BalanceVariationsService } from './services/balance-variations-service';

@Component({
  selector: 'app-balance',
  imports: [],
  templateUrl: './balance.html',
  styleUrl: './balance.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Balance implements OnInit{
  private readonly balanceService = inject(BalanceService);
  private readonly balanceVariationsService = inject(BalanceVariationsService);
  protected readonly incomeVariationsState = this.balanceVariationsService.incomeState;
  protected readonly expensesVariationsState = this.balanceVariationsService.expensesState;
  protected readonly withdrawalState = this.balanceService.withdrawalState;
  protected readonly incomeState = this.balanceService.incomeState;
  protected readonly balanceState = this.balanceService.balanceState;

  protected processing = signal(false);

  protected show = signal<'movements' | 'withdrawalList' | 'incomeList' | 'withdrawal'>('movements');

  protected records = computed(() => {
    const withdrawals = this.withdrawalState().data.map((item) => ({
      ...item,
      type: 'withdrawal' as const,
    }));
    const incomes = this.incomeState().data.map((item) => ({
      ...item,
      type: 'income' as const,
    }));
    return [...withdrawals, ...incomes].sort(
      (a, b) => b.created.getTime() - a.created.getTime()
    );
  });

  constructor(){
    effect(() => {
      const template = this.show();
      if(template === 'withdrawal'){
        this.balanceService.getBalance(true);
      }
    })
  }

  ngOnInit(): void {
    this.balanceService.getWithdrawalList();
    this.balanceService.getIncomeList();
  };

  onChange(template: 'movements' | 'withdrawalList' | 'incomeList' | 'withdrawal'){
    this.show.set(template);
  };

  async onWithdrawal(input: number){
    if(this.balanceState().data.balance < input) return;
    if(this.processing()) return;
    this.processing.set(true);
    const result = await this.balanceService.makeWithdrawal(input);
    if(result){
      if(!result.error){
        this.checkResult(result.data);
        return;
      }else{
        this.errorManager(result.data);
      }
    };
    this.balanceService.getWithdrawalList(true);
    this.onChange('withdrawalList');
    this.processing.set(false);
  };

  async checkResult(token: string){
    const result = await this.balanceService.getResult(token);
    if(result) this.errorManager(result);
    this.balanceService.getWithdrawalList(true);
    this.onChange('withdrawalList');
    this.processing.set(false);
  };

  onRetry(){
    if(this.show() === 'movements'){
      this.balanceService.getWithdrawalList(true);
      this.balanceService.getIncomeList(true);
    }else if(this.show() === 'incomeList'){
      this.balanceService.getIncomeList(true);
    }else if(this.show() === 'withdrawalList'){
      this.balanceService.getWithdrawalList(true);
    }else{
      this.balanceService.getBalance(true);
    }
  };

  onGetVariations(since?: Date, until?: Date){
    if(!since && until) return;

    if(since && !until) until = new Date();

    if(this.show() === 'incomeList'){
      this.balanceVariationsService.getIncomes(since, until);
    }else{
      this.balanceVariationsService.getExpenses(since, until);
    };
  };

  onCleanVariationError(){
    if(this.show() === 'incomeList'){
      this.balanceVariationsService.cleanIncomesError();
    }else{
      this.balanceVariationsService.cleanExpensesError();
    };
  };

  errorManager(error: string){
    let message: string;
    switch(error){
      case 'TIMEOUT':
        message = 'Error al obtener el resultado.';
        break;
      case 'UNAVAILABLE':
        message = 'Actualmente estamos realizando mantenimiento, aguarde unos minutos y vuelva a intentarlo.';
        break;
      case 'INTERNAL_ERROR':
        message = 'Ups! Parece que algo ha fallado, vuelva a intntar. Si el error persiste contacte con soporte.';
        break;
      case 'BAD_REQUEST':
        message = "Su cuenta no cuenta con un cbu asociado, para realizr retiros actualice sus datos.";
        break;
      case 'ALREADY_RESOLVED':
        message = 'Algo ha fallado, verifique si su retiro se ha realizado.';
        break;
      case 'FAILED':
        message = 'Error obteniendo el resultado, verifique si su retiro se ha realizado.';
        break;
      case 'NETWORK_ERROR':
        message = 'Error de coneccion. Checke su conneccion a internet y reintente.';
        break;
      default:
        message = "Error interno, intente nuevamente. Si el error persiste contacte con soporte tecnico."
        break;
    };
    // alerta de error con el contenido de "message"
  }
}
