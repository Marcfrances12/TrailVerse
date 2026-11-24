import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Comentario, ComentarioDatos } from '../../../../core/models/comment.model';
import { Estrellas } from '../../../../shared/components/estrellas/estrellas';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { formatFecha } from '../../../../shared/utils/formatos';
import { ComentarioForm } from '../comentario-form/comentario-form';

@Component({
  selector: 'app-comentario-item',
  imports: [Estrellas, UserAvatar, ComentarioForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comentario-item.html'
})
export class ComentarioItem {
  readonly comentario = input.required<Comentario>();
  /** El admin también puede borrar comentarios ajenos (el backend lo vuelve a comprobar). */
  readonly puedeBorrar = input(false);
  readonly editando = input(false);
  readonly enviando = input(false);

  readonly empezarEdicion = output<void>();
  readonly cancelarEdicion = output<void>();
  readonly guardar = output<ComentarioDatos>();
  readonly borrar = output<void>();

  readonly formatFecha = formatFecha;
}
