// Copyright 2014 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "HTGCViewController.h"
#import "HTGCTextChannel.h"

static NSString *const kReceiverAppID = @"33AA2579";

@interface HTGCViewController () {
  UITextField *messageTextField;
  UIImage *_btnImage;
  UIImage *_btnImageSelected;
 
  // Touch vars
  CGFloat _dragThreshold;
  CGPoint _lastTouch;
}

// Chromecast properties
@property GCKApplicationMetadata *applicationMetadata;
@property GCKDevice *selectedDevice;
@property HTGCTextChannel *textChannel;

@end

@implementation HTGCViewController

- (void)viewDidLoad {
  [super viewDidLoad];

  //Create cast button
  _btnImage = [UIImage imageNamed:@"icon-cast-identified.png"];
  _btnImageSelected = [UIImage imageNamed:@"icon-cast-connected.png"];

  _chromecastButton = [UIButton buttonWithType:UIButtonTypeRoundedRect];
  [_chromecastButton addTarget:self
                        action:@selector(chooseDevice:)
              forControlEvents:UIControlEventTouchDown];
  _chromecastButton.frame = CGRectMake(0, 0, _btnImage.size.width, _btnImage.size.height);
  [_chromecastButton setImage:nil forState:UIControlStateNormal];
  _chromecastButton.hidden = YES;

  //add cast button to navigation bar
  self.navigationItem.rightBarButtonItem =
      [[UIBarButtonItem alloc] initWithCustomView:_chromecastButton];

  //Initialize device scanner
  self.deviceScanner = [[GCKDeviceScanner alloc] init];
  [self.deviceScanner addListener:self];
  [self.deviceScanner startScan];
    
  // Initialise defaults in UI
  CGRect screenRect = [[UIScreen mainScreen] bounds];
  CGFloat screenWidth = screenRect.size.width;
  _dragThreshold = screenWidth * [self.slider value];
  [[self sliderLabel] setText:[NSString stringWithFormat:@"%dpx", (int)_dragThreshold]];
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}

- (void)chooseDevice:(id)sender {
  //Choose device
  if (self.selectedDevice == nil) {
    //Device Selection List
    UIActionSheet *sheet =
        [[UIActionSheet alloc] initWithTitle:NSLocalizedString(@"Connect to Device", nil)
                                    delegate:self
                           cancelButtonTitle:nil
                      destructiveButtonTitle:nil
                           otherButtonTitles:nil];

    for (GCKDevice *device in self.deviceScanner.devices) {
      [sheet addButtonWithTitle:device.friendlyName];
    }

    [sheet addButtonWithTitle:NSLocalizedString(@"Cancel", nil)];
    sheet.cancelButtonIndex = sheet.numberOfButtons - 1;

    [sheet showInView:_chromecastButton];
  } else {
    //Already connected information
    NSString *str = [NSString stringWithFormat:NSLocalizedString(@"Casting to %@", nil),
        self.selectedDevice.friendlyName];
    NSString *mediaTitle = [self.mediaInformation.metadata stringForKey:kGCKMetadataKeyTitle];

    UIActionSheet *sheet = [[UIActionSheet alloc] init];
    sheet.title = str;
    sheet.delegate = self;
    if (mediaTitle != nil) {
      [sheet addButtonWithTitle:mediaTitle];
    }
    [sheet addButtonWithTitle:@"Disconnect"];
    [sheet addButtonWithTitle:@"Cancel"];
    sheet.destructiveButtonIndex = (mediaTitle != nil ? 1 : 0);
    sheet.cancelButtonIndex = (mediaTitle != nil ? 2 : 1);

    [sheet showInView:_chromecastButton];
  }
}

- (BOOL)isConnected {
  return self.deviceManager.isConnected;
}

- (void)connectToDevice {
  if (self.selectedDevice == nil)
    return;

  NSDictionary *info = [[NSBundle mainBundle] infoDictionary];
  self.deviceManager =
      [[GCKDeviceManager alloc] initWithDevice:self.selectedDevice
                             clientPackageName:[info objectForKey:@"CFBundleIdentifier"]];
  self.deviceManager.delegate = self;
  [self.deviceManager connect];
}

- (void)deviceDisconnected {
  self.textChannel = nil;
  self.deviceManager = nil;
  self.selectedDevice = nil;
  NSLog(@"Device disconnected");
}

- (void)updateButtonStates {
  if (self.deviceScanner.devices.count == 0) {
    //Hide the cast button
    [_chromecastButton setImage:_btnImage forState:UIControlStateNormal];
    _chromecastButton.hidden = YES;
  } else {
    if (self.deviceManager && self.deviceManager.isConnected) {
      //Enabled state for cast button
      [_chromecastButton setImage:_btnImageSelected forState:UIControlStateNormal];
      [_chromecastButton setTintColor:[UIColor blueColor]];
      _chromecastButton.hidden = NO;
    } else {
      //Disabled state for cast button
      [_chromecastButton setImage:_btnImage forState:UIControlStateNormal];
      [_chromecastButton setTintColor:[UIColor grayColor]];
      _chromecastButton.hidden = NO;
    }
  }

}

#pragma mark - GCKDeviceScannerListener
- (void)deviceDidComeOnline:(GCKDevice *)device {
  NSLog(@"device found!! %@", device.friendlyName);
  [self updateButtonStates];
}

- (void)deviceDidGoOffline:(GCKDevice *)device {
  [self updateButtonStates];
}

#pragma mark UIActionSheetDelegate
- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex {
  if (self.selectedDevice == nil) {
    if (buttonIndex < self.deviceScanner.devices.count) {
      self.selectedDevice = self.deviceScanner.devices[buttonIndex];
      NSLog(@"Selecting device:%@", self.selectedDevice.friendlyName);
      [self connectToDevice];
    }
  } else {
    if (buttonIndex == 0) {  //Disconnect button
      NSLog(@"Disconnecting device:%@", self.selectedDevice.friendlyName);
      // New way of doing things: We're not going to stop the applicaton. We're just going
      // to leave it.
      [self.deviceManager leaveApplication];
      // If you want to force application to stop, uncomment below
      //[self.deviceManager stopApplicationWithSessionID:self.applicationMetadata.sessionID];
      [self.deviceManager disconnect];

      [self deviceDisconnected];
      [self updateButtonStates];
    } else if (buttonIndex == 0) {
      // Join the existing session.

    }
  }
}

#pragma mark - GCKDeviceManagerDelegate

- (void)deviceManagerDidConnect:(GCKDeviceManager *)deviceManager {
  NSLog(@"connected!!");

  [self updateButtonStates];

  //launch application after getting connectted
  [self.deviceManager launchApplication:kReceiverAppID];
}

- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didConnectToCastApplication:(GCKApplicationMetadata *)applicationMetadata
                      sessionID:(NSString *)sessionID
            launchedApplication:(BOOL)launchedApplication {
  NSLog(@"application has launched %hhd", launchedApplication);

  self.textChannel =
      [[HTGCTextChannel alloc] initWithNamespace:@"urn:x-cast:com.twjg.chromecast2048"];
  [self.deviceManager addChannel:self.textChannel];
}

- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didFailToConnectToApplicationWithError:(NSError *)error {
  [self showError:error];

  [self deviceDisconnected];
  [self updateButtonStates];
}

- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didFailToConnectWithError:(GCKError *)error {
  [self showError:error];

  [self deviceDisconnected];
  [self updateButtonStates];
}

- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didDisconnectWithError:(GCKError *)error {
  NSLog(@"Received notification that device disconnected");

  if (error != nil) {
    [self showError:error];
  }

  [self deviceDisconnected];
  [self updateButtonStates];

}

- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didReceiveStatusForApplication:(GCKApplicationMetadata *)applicationMetadata {
  self.applicationMetadata = applicationMetadata;

  NSLog(@"Received device status: %@", applicationMetadata);
}

#pragma mark Event listeners
- (IBAction)sendText:(id)sender {
    NSInteger tag = [sender tag];
    NSLog(@"sending text %d", tag);
    
    //Show alert if not connected
    if (!self.deviceManager || !self.deviceManager.isConnected) {
        UIAlertView *alert =
        [[UIAlertView alloc] initWithTitle:NSLocalizedString(@"Not Connected", nil)
                                   message:NSLocalizedString(@"Please connect to Cast device", nil)
                                  delegate:nil
                         cancelButtonTitle:NSLocalizedString(@"OK", nil)
                         otherButtonTitles:nil];
        [alert show];
        return;
    }
    
    [self.textChannel sendTextMessage:[NSString stringWithFormat:@"%d", tag]];
}

- (IBAction)sliderMoved:(id)sender {
    UISlider *slider = (UISlider *)sender;
    CGRect screenRect = [[UIScreen mainScreen] bounds];
    CGFloat screenWidth = screenRect.size.width;
    _dragThreshold = screenWidth * [slider value];
    
    [[self sliderLabel] setText:[NSString stringWithFormat:@"%dpx", (int)_dragThreshold]];
    NSLog(@"_dragThreshold ... %d",(int)_dragThreshold);
}

#pragma mark - Touch functionality
-(void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
    // Remove old red circles on screen
    NSArray *subviews = [self.view subviews];
    for (UIView *view in subviews) {
        if(view.tag == -1) {
            [view removeFromSuperview];
        };
    }
    
    // Enumerate over all the touches and draw a red dot on the screen where the touches were
    [touches enumerateObjectsUsingBlock:^(id obj, BOOL *stop) {
        // Get a single touch and it's location
        UITouch *touch = obj;
        _lastTouch = [touch locationInView:self.view];
        
        // Draw a red circle where the touch occurred
        UIView *touchView = [[UIView alloc] init];
        [touchView setBackgroundColor:[UIColor redColor]];
        touchView.frame = CGRectMake(_lastTouch.x - 15, _lastTouch.y - 15, 30, 30);
        touchView.layer.cornerRadius = 15;
        touchView.tag = -1;
        [self.view addSubview:touchView];
    }];
}

-(void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event {
    // Remove old red circles on screen
    NSArray *subviews = [self.view subviews];
    for (UIView *view in subviews) {
        if(view.tag == -1) {
            [view removeFromSuperview];
        }
    }
    
    // Enumerate over all the touches and draw a red dot on the screen where the touches were
    [touches enumerateObjectsUsingBlock:^(id obj, BOOL *stop) {
        // Get a single touch and it's location
        UITouch *touch = obj;
        CGPoint touchPoint = [touch locationInView:self.view];
        
        // Draw a line from start to end
        UIView *lineView = [[UIView alloc] init];
        lineView.tag = -1;
        UIBezierPath *path = [UIBezierPath bezierPath];
        [path moveToPoint:CGPointMake(_lastTouch.x, _lastTouch.y)];
        [path addLineToPoint:CGPointMake(touchPoint.x, touchPoint.y)];
        CAShapeLayer *shapeLayer = [CAShapeLayer layer];
        shapeLayer.path = [path CGPath];
        shapeLayer.strokeColor = [[UIColor blackColor] CGColor];
        shapeLayer.lineWidth = 2.0;
        shapeLayer.fillColor = [[UIColor clearColor] CGColor];
        [lineView.layer addSublayer:shapeLayer];
        [self.view addSubview:lineView];
        
        // Draw a red circle where the touch occurred
        UIView *touchView = [[UIView alloc] init];
        [touchView setBackgroundColor:[UIColor redColor]];
        touchView.frame = CGRectMake(touchPoint.x - 15, touchPoint.y - 15, 30, 30);
        touchView.layer.cornerRadius = 15;
        touchView.tag = -1;
        [self.view addSubview:touchView];
        
        // Update debug text
        NSInteger yDiff = _lastTouch.y - touchPoint.y;
        NSInteger xDiff = _lastTouch.x - touchPoint.x;
        
        NSInteger up = (yDiff > 0)? yDiff : 0;
        NSInteger down = (yDiff > 0)? 0 : abs(yDiff);
        NSInteger left = (xDiff > 0)? xDiff : 0;
        NSInteger right = (xDiff > 0)? 0 : abs(xDiff);
        
        NSString* debugText = [NSString stringWithFormat:@"[up: %d] [right: %d] [down: %d] [left: %d]", up, right, down, left];
        [self.dragDebug setText:debugText];
        
        // Detect if we should trigger a move - very much 'POC' code!
        if(up >= _dragThreshold) {
            [self.textChannel sendTextMessage:[NSString stringWithFormat:@"%d", 0]];
        } else if(right >= _dragThreshold) {
            [self.textChannel sendTextMessage:[NSString stringWithFormat:@"%d", 1]];
        } else if(down >= _dragThreshold) {
            [self.textChannel sendTextMessage:[NSString stringWithFormat:@"%d", 2]];
        } else if(left >= _dragThreshold) {
            [self.textChannel sendTextMessage:[NSString stringWithFormat:@"%d", 3]];
        }
        
        // Reset touch point
        if(up > _dragThreshold || right > _dragThreshold || down > _dragThreshold || left > _dragThreshold) {
            _lastTouch = touchPoint;
        }
    }];
}

#pragma mark - Error handling
- (void)showError:(NSError *)error {
  UIAlertView *alert = [[UIAlertView alloc] initWithTitle:NSLocalizedString(@"Error", nil)
                                                  message:NSLocalizedString(error.description, nil)
                                                 delegate:nil
                                        cancelButtonTitle:NSLocalizedString(@"OK", nil)
                                        otherButtonTitles:nil];
  [alert show];
}

@end
