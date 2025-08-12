import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { ButtonComponent } from '@layouts/button/button.component';
import { ModalService } from '@components/modal/modal.service';
import { ModalData } from '@components/modal/modal.model';
import { Validators } from '@angular/forms';
import { FeedsService } from '@services/feeds/feeds.service';
import { LoaderService } from '@services/loader/loader.service';
import { Alert } from '@components/alert/alert';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [CommonModule, MatMenuModule, ButtonComponent],
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss']
})
export class ActionsComponent {
  @Input() feedKey?: string; // opcional: si lo pasas, se usa para Eliminar

  constructor(
    private modal: ModalService,
    private feeds: FeedsService,
    private loader: LoaderService,
    private alert: Alert
  ) {}

  openCreate(): void {
    const modalData: ModalData = {
      title: 'Crear Sensor',
      confirmButtonText: 'Aceptar',
      fields: [
        { name: 'key', label: 'Key', validators: [Validators.required] },
        { name: 'name', label: 'Nombre', validators: [Validators.required] },
        { name: 'description', label: 'Descripcion' }
      ]
    };

    const ref = this.modal.open(modalData);
    ref.afterClosed().subscribe(async (result) => {
      if (!result) return;
      this.loader.show('Creando sensor...');
    });
  }

  openDelete(): void {
    if (this.feedKey) {
      // Confirmación directa con key conocida
      const ref = this.modal.open({
        title: 'Eliminar sensor',
        confirmButtonText: 'Aceptar',
        // sin fields: modal de confirmación simple
      } as ModalData);

      ref.afterClosed().subscribe(async (ok) => {
        if (!ok) return;
        await this.deleteByKey(this.feedKey!);
      });
      return;
    }

    // Si no se pasa feedKey, pedimos la key
    const ref = this.modal.open({
      title: 'Eliminar sensor',
      confirmButtonText: 'Aceptar',
      fields: [
        { name: 'key', label: 'Key', validators: [Validators.required] }
      ]
    } as ModalData);

    ref.afterClosed().subscribe(async (result) => {
      if (!result?.key) return;
      await this.deleteByKey(result.key);
    });
  }

  private async deleteByKey(key: string) {
    this.loader.show('Eliminando sensor...');
    try {
      await firstValueFrom(this.feeds.deleteFeed(key));
      this.alert.showSuccess('Sensor eliminado exitosamente.');
    } catch (e: any) {
      this.alert.showError(e?.error || 'Error al eliminar el sensor.');
    } finally {
      this.loader.hide();
    }
  }
}