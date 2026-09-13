# Sistema de frete — SuperFrete + contingência

## Resultado

Adicionar cálculo de frete ao checkout com duas camadas: SuperFrete como fonte principal e tarifas administráveis como contingência. Bicicletas e serviços serão sempre retirados na loja; peças, acessórios e vestuário poderão ser enviados. Carrinhos mistos continuarão em um único pedido.

## Banco e dados

- Adicionar aos produtos: peso, altura, largura e comprimento, com valores provisórios para os itens atuais e edição no painel.
- Criar `shipping_config` com ativação da SuperFrete, CEP de origem `54589-050`, serviços habilitados e medidas provisórias padrão.
- Criar `shipping_rates` com faixa de CEP, região, faixa de peso, preço, prazo e status; cadastrar uma tabela provisória claramente sinalizada no painel.
- Adicionar ao pedido o subtotal, custo do frete, serviço, transportadora, prazo e modalidade; manter o total final incluindo frete e desconto.
- Bloquear acesso público direto às configurações e tarifas; toda leitura e escrita passará pelo servidor, com alterações restritas a administradores.

## Cálculo no servidor

- Criar uma função interna que busca os produtos pelo ID e ignora preço, categoria, peso e dimensões enviados pelo navegador.
- Classificar como retirada as categorias `bicicletas` e `manutencao-servicos`; enviar apenas `pecas-componentes`, `acessorios` e `vestuario`.
- Consultar `POST /api/v0/calculator` da SuperFrete com CEPs, produtos, medidas e token somente no servidor.
- Aceitar opções válidas de Correios, Jadlog e Loggi, retornando preço, prazo, serviço e origem da cotação.
- Em token ausente, integração desativada, timeout ou indisponibilidade, calcular automaticamente pela tarifa provisória compatível com CEP e peso.
- Recalcular a opção escolhida no servidor ao criar o pedido. O navegador enviará apenas a identificação da opção, nunca um preço confiável.
- Se não houver item enviável, retornar somente retirada gratuita. Em carrinho misto, cobrar apenas pelos itens enviáveis e listar os demais como retirada.

## Checkout e pedidos

- Exibir “Retirada na loja” em cada item não elegível no carrinho e checkout.
- Após o CEP, mostrar opções de entrega para escolha do cliente, com transportadora, serviço, valor e prazo.
- Invalidar a escolha quando CEP ou itens mudarem e exigir nova cotação antes do pagamento.
- Mostrar subtotal, desconto, frete e total final; adicionar o frete como item separado na preferência do Mercado Pago.
- Persistir a cotação escolhida no pedido e exibir seu resumo na confirmação, conta do cliente e detalhes administrativos.

## Painel administrativo

- Adicionar peso e dimensões ao formulário de produto.
- Criar aba “Frete” com:
  - status “SuperFrete configurada/não configurada” sem revelar o token;
  - ativação, CEP de origem, serviços e medidas padrão;
  - CRUD das tarifas de contingência;
  - aviso visível de que as tarifas iniciais são provisórias.
- Todas as operações usam funções autenticadas com verificação de administrador no servidor.

## Configuração do token

- A implementação funcionará imediatamente pela contingência.
- O token real será armazenado como `SUPERFRETE_TOKEN` no cofre de segredos, nunca no código ou banco.
- Como a credencial ainda não está configurada, o painel mostrará “não configurada” até ela ser adicionada com segurança.

## Verificação

- Validar regras de categoria, carrinho somente retirada, somente entrega e misto.
- Validar seleção de opção, alteração de CEP/itens, combinação com cupom e recálculo no fechamento.
- Validar fallback sem token e com falha da SuperFrete.
- Validar CRUD administrativo e bloqueio para não administradores.
- Conferir checkout e painel em telas desktop e celular, sem erros de navegação ou console.
