import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'login',
  standalone: true
})
export class LoginPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
