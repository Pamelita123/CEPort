import { Component, Input, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import { LoaderService, LoaderState } from '../../services/loader/loader.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-loader',
  imports: [MatProgressBarModule, CommonModule],
  templateUrl: './loader.html',
  styleUrls: ['./loader.scss'],
  standalone: true
})
export class LoaderComponent implements OnInit, OnDestroy {
  private readonly loaderService = inject(LoaderService);
  
  private readonly loaderState = signal<LoaderState>({
    isLoading: false,
    message: 'Cargando...'
  });
  

  readonly isLoading = computed(() => this.loaderState().isLoading);
  readonly message = computed(() => this.loaderState().message);

  @Input() overrideIsLoading?: boolean;
  

  @Input() overrideMessage?: string;
  

  readonly finalIsLoading = computed(() => 
    this.overrideIsLoading ?? this.isLoading()
  );
  
  readonly finalMessage = computed(() => 
    this.overrideMessage ?? this.message()
  );
  
  private loaderSubscription?: Subscription;

  ngOnInit(): void {

    this.loaderSubscription = this.loaderService.loader$.subscribe({
      next: (state: LoaderState) => {
        this.loaderState.set(state);
      },
      error: (error) => {
        console.error('Error en loader service:', error);
        this.loaderState.set({
          isLoading: false,
          message: 'Error al cargar'
        });
      }
    });
  }

  ngOnDestroy(): void {

    this.loaderSubscription?.unsubscribe();
  }
}
