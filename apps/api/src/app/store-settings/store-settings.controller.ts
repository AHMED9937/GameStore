import { Controller, Get } from '@nestjs/common';
import { StoreSettingsService } from './store-settings.service';

@Controller('settings')
export class StoreSettingsController {
  constructor(private readonly storeSettings: StoreSettingsService) {}

  @Get('faq-ubisoft')
  getFaqUbisoftSettings() {
    return this.storeSettings.getFaqUbisoftSettings();
  }
}
