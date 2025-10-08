import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  // @Get('docs')
  // @Redirect('https://docs.nestjs.com', HttpStatus.FOUND)
  // getDocs(@Query('version') version) {
  //   if (version && version === '5') {
  //     return { url: 'https://docs.nestjs.com/v5/' };
  //   }
  // }
  //
  // @Get('res')
  // getRes(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
  //   res.status(HttpStatus.FOUND);
  //
  //   const ip = req.headers['x-forwarded-for'] || req.ip;
  //   const ipv4 = ip?.toString().replace('::ffff:', '').split(',')[0];
  //
  //   return { ip: ipv4, url: req.url };
  // }
}
