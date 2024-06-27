import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormatService {
  private emailReg: RegExp = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-za-z]{2,}$/;
  private charList: string[] = ['\\', '\/', ':', '*', '?', '\"', '<', '>', '|', '.'];

  constructor() { }

  emailFormat(email: string) {
    return !this.emailReg.test(email)
  }

  registerFormat(form: FormGroup) {
    return !form.value.name || !form.value.last_name || !form.value.email || !form.value.password;
  }

  loginFormat(form: FormGroup) {
    return !form.value.email || !form.value.password;
  }

  passwordFormat(form: FormGroup) {
    if (!form.value.new_password && !form.value.repeat_password) {
      return 4;
    } else if (!form.value.new_password || !form.value.repeat_password) {
      return 3;
    } else if (form.value.new_password != form.value.repeat_password) {
      return 2;
    } else {
      return 1;
    }
  }

  isValidName(name: string): boolean {
    let correct = true;
    this.charList.forEach(char => {
      if (name.includes(char)) {
        correct = false;
      }
    });
    return correct;
  }

  hasBorderSpaces(name: string): boolean {
    return name.split(' ').includes('');
  }

  getCharList(): string[] {
    return this.charList;
  }
}
