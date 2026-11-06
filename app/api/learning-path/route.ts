import { NextResponse } from "next/server";
import { sourceLanguages } from "@/lib/languages";
import { lessons } from "@/lib/data";

const languages: Record<string,string> = Object.fromEntries(sourceLanguages.map(language => [language.code, language.label]));
const levels = ["Beginner","Intermediate","Advanced"];
const goals = ["Travel","College","Work","Shopping","Everyday communication"];
const hits = new Map<string,number[]>();
function limited(ip:string){const now=Date.now();const current=(hits.get(ip)||[]).filter(time=>now-time<60_000);current.push(now);hits.set(ip,current);return current.length>8;}

export async function POST(request:Request){
  let body:{language?:unknown;level?:unknown;goal?:unknown;minutes?:unknown};
  try{body=await request.json()}catch{return NextResponse.json({message:"Invalid learning-path request."},{status:400})}
  const language=typeof body.language==="string"?body.language:"";const level=typeof body.level==="string"?body.level:"";const goal=typeof body.goal==="string"?body.goal:"";const minutes=Number(body.minutes);
  if(!languages[language]||!levels.includes(level)||!goals.includes(goal)||!Number.isInteger(minutes)||minutes<5||minutes>60)return NextResponse.json({message:"Choose a supported language, level, goal, and 5–60 minute daily target."},{status:400});
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local";if(limited(ip))return NextResponse.json({message:"Too many path requests. Wait a minute and try again."},{status:429});
  const key=process.env.GEMINI_API_KEY;if(!key)return NextResponse.json({message:"AI path generation requires GEMINI_API_KEY in .env.local."},{status:503});
  const model=process.env.GEMINI_MODEL||"gemini-3.8-flash";
  const catalog=lessons.map(item=>({slug:item.slug,title:item.title,level:item.level||"beginner",description:item.blurb}));
  const system=`Create a practical 7-day Kannada study path for a learner whose preferred explanation language is ${languages[language]}, level is ${level}, goal is ${goal}, and daily study time is ${minutes} minutes. Choose one existing lesson per day from the supplied catalog. Every lessonSlug must exactly match a catalog slug. Sequence suitable lessons from easier to harder, favor the learner's goal, and do not invent Kannada phrases or claim lesson content that isn't present. Return JSON exactly shaped as {"steps":[{"day":1,"title":"short daily focus","focus":"one sentence","coachTip":"one encouraging actionable suggestion","lessonSlug":"existing-slug"}]} with exactly seven steps numbered 1 through 7. Catalog: ${JSON.stringify(catalog)}`;
  try{
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:"POST",signal:AbortSignal.timeout(60_000),headers:{"x-goog-api-key":key,"content-type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:"user",parts:[{text:"Generate my seven-day learning path."}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens:2500,temperature:.4}})});
    if(!response.ok){if(response.status===401||response.status===403)return NextResponse.json({message:"Gemini rejected its API key or access is not enabled."},{status:502});if(response.status===404)return NextResponse.json({message:`Gemini model (${model}) was not found.`},{status:502});if(response.status===429)return NextResponse.json({message:"Gemini is busy or the account limit was reached. Try again shortly."},{status:503});return NextResponse.json({message:`Gemini path-generation error (${response.status}). Please retry.`},{status:502});}
    const data=await response.json();const raw=data.candidates?.[0]?.content?.parts?.map((part:{text?:string})=>part.text||"").join("")||"";const parsed=JSON.parse(raw);if(!Array.isArray(parsed.steps)||parsed.steps.length!==7)throw new Error("Invalid learning path");
    const slugs=new Set(lessons.map(item=>item.slug));const steps=parsed.steps.map((step:Record<string,unknown>,index:number)=>{if(step.day!==index+1||typeof step.title!=="string"||typeof step.focus!=="string"||typeof step.coachTip!=="string"||typeof step.lessonSlug!=="string"||!slugs.has(step.lessonSlug))throw new Error("Invalid learning step");return {day:index+1,title:step.title.slice(0,80),focus:step.focus.slice(0,220),coachTip:step.coachTip.slice(0,180),lessonSlug:step.lessonSlug};});
    return NextResponse.json({steps,level,goal,minutes,language:languages[language],generatedAt:new Date().toISOString()});
  }catch(error){return NextResponse.json({message:error instanceof Error&&error.name==="TimeoutError"?"Generating your path took too long. Please retry.":"Gemini returned an invalid path. Please retry."},{status:502});}
}
