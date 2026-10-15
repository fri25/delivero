import { createHash } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediasService, signerParametres } from './medias.service';

function service(env: Record<string, string>) {
  return new MediasService(new ConfigService(env));
}

const ENV = {
  CLOUDINARY_CLOUD_NAME: 'chapx',
  CLOUDINARY_API_KEY: '123',
  CLOUDINARY_API_SECRET: 'secret',
};

describe('signerParametres', () => {
  it('follows the Cloudinary scheme: sorted pairs + secret, SHA-1', () => {
    const attendu = createHash('sha1')
      .update('folder=chapexpress/colis&timestamp=1700000000secret')
      .digest('hex');
    expect(
      signerParametres(
        { timestamp: '1700000000', folder: 'chapexpress/colis' },
        'secret',
      ),
    ).toBe(attendu);
  });
});

describe('MediasService', () => {
  it('is inactive without credentials', () => {
    expect(service({}).configPublique().actif).toBe(false);
    expect(() => service({}).signer('colis')).toThrow();
  });

  it('signs uploads into the folder of the usage', () => {
    const signature = service(ENV).signer('courses');
    expect(signature).toMatchObject({
      cloudName: 'chapx',
      apiKey: '123',
      folder: 'chapexpress/courses',
      allowed_formats: 'jpg,jpeg,png,webp',
    });
    expect(signature.signature).toMatch(/^[0-9a-f]{40}$/);

    const signaturePlats = service(ENV).signer('plats');
    expect(signaturePlats).toMatchObject({
      cloudName: 'chapx',
      apiKey: '123',
      folder: 'chapexpress/plats',
      allowed_formats: 'jpg,jpeg,png,webp',
    });
  });

  it('only accepts our own Cloudinary URLs, in the right folder', () => {
    const medias = service(ENV);
    const ok =
      'https://res.cloudinary.com/chapx/image/upload/v1/chapexpress/colis/abc.jpg';
    expect(() => medias.assertUrlsAutorisees([ok], 'colis')).not.toThrow();
    expect(() => medias.assertUrlsAutorisees(undefined, 'colis')).not.toThrow();

    for (const url of [
      'https://evil.example/chapexpress/colis/abc.jpg',
      'https://res.cloudinary.com/autre/image/upload/v1/chapexpress/colis/abc.jpg',
      'https://res.cloudinary.com/chapx/image/upload/v1/chapexpress/courses/abc.jpg',
    ]) {
      expect(() => medias.assertUrlsAutorisees([url], 'colis')).toThrow(
        BadRequestException,
      );
    }
  });
});
