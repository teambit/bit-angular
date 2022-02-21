import { ComponentContext, ComponentFile } from '@teambit/generator';

export const faviconFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;
  return {
    relativePath: `src/favicon.ico`,
    content: `ʐNG


IHDR      \b   ?ƾߠ  \tpHYs    ӝ~��fIDATHɕWKLQ޳ꌔҖuGі\teÎn̮\f6qcbì?Ÿ҄\`ʆ#ƍKu䆍1Qc̊̢!ň࠸\tٱCǐżB?$՜ѳ܎ގ͉&}󞽯̽s*ԉUɁɞ ՋގyxΛgY��ꭕ3L\tŠԝ Ù˫ϏDǴڦ3Ϗ:Xֳѐޯܐ\fJÄ࠯#IHáؿϏӬ{>1/߲$Ē\tAR]誷?䳐Zw^��Йǭ_ڗeŰò[8󞪊έ؍Ё}cԕ- 𼬃¶!µ́2_)\fEީ㊪jؔĶփm˚ ۚOi㎋g�͚{<n8ِ̝ؗo}$8ϋٲй|$蟫��Զϐ<Ҫܒ>ۮ.|챥2ס&ѰaŸѡݮbe̍΃񦋤E%-{ٖږګ׮CȥNXi۾cʃ,t߯Tȓ̐��{󠙌)s֒V\b֬6%Ĩȣᤙ!ꞿˁHƒш$R�R��1(?Y舚о؎ͨZ𗃄��L\b2̋՚Ic֊ӥ͌ǄCȄ2!⅄ ߨ
טԢ чoą>򱘰=𝆪$%ݺ\`ѯǣT󦎾эPH\bh˚!=저̺đOϵۻ򵛒,*VVVձʛf*C\bJ뉝EEċKѐk��#5֤ҟ\`2yT!軽7ߧڟɾlŇкsɴL�T܍Vơ܁鴄򿂞C2Ňń@%̑72YД޾{oJȢ@ֈ^\bh˾\fڞfĬסaՄ儶6ߗ猈a|쳶č  [>Ʉفً]7U2пıҏ] D׊ɏPUЌܮWejq򄩮؈g܆+ p<ߺQH݂ퟎ�ު[ȇ֎ܢ.޴銑ڜð _󋂲1(Ų+ɥbB8❲a
،Dv.lݽ▨䝴ǽҷĖ��񷌸ۃ͡    IENDς\`
`,
  };
};
