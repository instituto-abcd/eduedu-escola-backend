import { Injectable } from "@nestjs/common";

@Injectable()
export class DateFormatterUtilsService {

    convertMsToTime(milliseconds: number) {
        let seconds = Math.floor(milliseconds / 1000);
        let minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        seconds = seconds % 60;
        minutes = minutes % 60;
        
        return `${this.padTo2Digits(hours)}:${this.padTo2Digits(minutes)}:${this.padTo2Digits(
            seconds,
        )}`;
    }

    private padTo2Digits(num: number) {
        return num.toString().padStart(2, '0');
    }

}
