PVector view;
int worldRadious;
int viewRadious;

int area;
Blob[] blobs;
ArrayList<float[][]> trainingData;
PVector worldCenter;

void setup() {
  size(700, 700);
  trainingData = new ArrayList();
  view = new PVector(width/2, height/2);
  println("init");
  //init();
  //drawUpdate();
}

void mousePressed() {
  println("mouse");
  //trainingData.add(toData());
  //println(trainingData);
  //init();
  //drawUpdate();
}

float[][] toData() {
  float[][] trainingEntry = new float[2][];
  trainingEntry[0] = new float[13];
  trainingEntry[0][0] = areaToData(area);
  for (int i = 0; i < blobs.length; i++) {
    blobs[i].toData(trainingEntry[0], 1+i*3); 
  }
  trainingEntry[1] = new float[2];
  PVector intention = new PVector(mouseX-width/2, mouseY-height/2);
  trainingEntry[1][0] = angleToData(angle(intention));
  trainingEntry[1][1] = distToData(intention.mag());
  
  return trainingEntry;
}

void init() {
  worldRadious = 600;
  viewRadious = 250;
  worldCenter = randomVec(worldRadious).add(view);
  
  area = randomArea();
  blobs = new Blob[] { new Blob(), new Blob(), new Blob(), new Blob() };
  
  Compare<Blob> cmpByAreaReversed = new Compare<Blob>() {
    @Override public boolean lte(Blob b1, Blob b2) {
      return b1.area >= b2.area;
    }
  };
  sort(cmpByAreaReversed, blobs);
}

void drawUpdate() {
  background(255*0.4);
  
  for (int i = 0; i < blobs.length; i++) {
    blobs[i].draw();
  }
  drawBlob(0,0,area);
  
  noFill();
  stroke(color(255*0.2));
  ellipse(worldCenter.x,worldCenter.y,worldRadious*2,worldRadious*2);
  
  noFill();
  stroke(color(255*0.1));
  ellipse(view.x,view.y,viewRadious*2,viewRadious*2);
}

PVector randomVec(int maxRadious) {
  float angle = map(random(2^20), 0, 2^20, 0, TWO_PI);
  float dist = map(sqrt(random(2^20)), 0, 2^10, 0, maxRadious);
  return PVector.fromAngle(angle).mult(dist);
}
  
float angleToData(float a) { return map(a, -PI, PI, 0, 1); }
float distToData(float d) { return map(d, 0, viewRadious*2, 0, 1); }
float areaToData(float a) { return map(a, 0, viewRadious*viewRadious*PI, 0, 1); }
float dataToAngle(float d) { return map(d, 0, 1, -PI, PI); }
float dataToDist(float d) { return map(d, 0, 1, 0, viewRadious*2); }

int randomArea() { return floor(exp(map(random(2^20), 0, 2^20, log(2^4), log(viewRadious*viewRadious*PI)))); }

void drawBlob(float x, float y, int area) {
  fill(color(255*0.7));
  stroke(color(255*1));
  ellipse(x+width/2,y+height/2,sqrt(area/PI),sqrt(area/PI));
}

float angle(PVector v) {
  float a = atan(v.y/v.x);
  while (a < 0) a += PI;
  while (a > Math.PI) a -= PI;

  if (v.y < 0) a -= PI;
  return a;
}
  
class Blob {
  PVector pos;
  int area;
  public Blob() {
    pos = randomVec(viewRadious);
    area = randomArea();
  }
  
  public void toData(float[] result, int from) {
    result[from+0] = angleToData(angle(pos)); 
    result[from+1] = distToData(pos.mag());
    result[from+2] = areaToData(area);
  }
  
  public void draw() {
    drawBlob(pos.x, pos.y, area);
  }
}

<T> T[] sort(Compare<T> cmp, T[] arr) {
  sort(cmp, arr, 0, arr.length-1);
  return arr;
}
<T> void sort(Compare<T> cmp, T[] arr, int start, int end) {
  while (true) {
    int pivot = organize(cmp, arr, start, end, floor(random(start, end)));
    if (start < pivot) sort(cmp, arr, start, pivot-1);
    start = pivot+1;
    if (pivot == end) break;
  }
}
<T> int organize(Compare<T> cmp, T[] arr, int start, int end, int pivot) {
  while (start < end) {
    if (start < pivot & cmp.lte(arr[start], arr[pivot])) {
      start++;
    }
    else if (pivot < end & cmp.lte(arr[pivot], arr[end])) {
      end--;
    }
    else if (!cmp.lte(arr[start], arr[pivot]) & !cmp.lte(arr[pivot], arr[end])) {
      T temp = arr[start];
      arr[start] = arr[end];
      arr[end] = temp;
      if (pivot == start) {
        pivot = end;
        start++;
      }
      if (pivot == end) {
        pivot = start;
        end--;
      }
    }
    else if (start == pivot) {
      T temp = arr[start];
      arr[start] = arr[end];
      arr[end] = temp;
      
      pivot = end;
      start++;
    }
    else { // pivot == end
      T temp = arr[start];
      arr[start] = arr[end];
      arr[end] = temp;
      
      pivot = start;
      end--;
    }
  }
  
  return pivot;
}

interface Compare<T> {
  public boolean lte(T a, T b);
}
