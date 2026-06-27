import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("OpenAPI docs", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();

    const config = new DocumentBuilder().setTitle("GitInsight API").build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("exposes analysis job create payload fields in openapi document", async () => {
    const res = await request(app.getHttpServer()).get("/docs-json");
    expect(res.status).toBe(200);

    const schema =
      res.body?.components?.schemas?.CreateAnalysisJobDto?.properties ?? {};

    expect(schema.repo_url).toBeDefined();
    expect(schema.time_window).toBeDefined();
    expect(schema.trigger_type).toBeDefined();
  });
});
