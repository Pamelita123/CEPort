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
  @Input() feedKey?: string; 

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
      const ref = this.modal.open({
        title: 'Eliminar sensor',
        confirmButtonText: 'Aceptar',
      } as ModalData);

      ref.afterClosed().subscribe(async (ok) => {
        if (!ok) return;
        await this.deleteByKey(this.feedKey!);
      });
      return;
    }

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

  async openEdit(): Promise<void> {
    try {

      if (this.feedKey) {
        const current = await firstValueFrom(this.feeds.getFeed(this.feedKey));
        const ref = this.modal.open({
          title: 'Editar nombre del sensor',
          confirmButtonText: 'Guardar',
          fields: [
            {
              name: 'name',
              label: 'Nuevo nombre',
              type: 'text',
              initialValue: current?.name ?? '',
              validators: [Validators.required]
            }
          ]
        } as ModalData);

        ref.afterClosed().subscribe(async (result) => {
          if (!result?.name) return;
          await this.updateByKey(this.feedKey!, result.name);
        });
        return;
      }
      const feeds = await firstValueFrom(this.feeds.getAllFeeds());
      const options = feeds.map(f => ({ label: `${f.name} (${f.key})`, value: f.key }));

      const ref = this.modal.open({
        title: 'Editar nombre del sensor',
        confirmButtonText: 'Guardar',
        fields: [
          {
            name: 'key',
            label: 'Selecciona el sensor',
            type: 'select',
            options,
            validators: [Validators.required]
          },
          {
            name: 'name',
            label: 'Nuevo nombre',
            type: 'text',
            validators: [Validators.required]
          }
        ]
      } as ModalData);

      ref.afterClosed().subscribe(async (result) => {
        if (!result?.key || !result?.name) return;
        await this.updateByKey(result.key, result.name);
      });
    } catch (e: any) {
      this.alert.showError(e?.error || 'No se pudo cargar la información de los sensores.');
    }
  }

  private async updateByKey(key: string, name: string) {
    this.loader.show('Actualizando sensor...');
    try {
      await firstValueFrom(this.feeds.updateFeed(key, { key, name }));
      this.alert.showSuccess('Nombre del sensor actualizado.');
    } catch (e: any) {
      this.alert.showError(e?.error || 'Error al actualizar el sensor.');
    } finally {
      this.loader.hide();
    }
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