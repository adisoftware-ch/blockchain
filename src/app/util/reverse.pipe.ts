import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'reverse'
})
export class ReversePipe implements PipeTransform {

    transform(value) {
        console.log('hello pipe');
        if (!value) {
            return;
        }
        return value.reverse();
    }

}
