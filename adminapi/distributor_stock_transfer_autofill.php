<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['json_fse_detail']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$dist_operator=isset($_POST['operator']) ? $_POST['operator'] : '';
	if($dist_operator=='')
	{
		$check_author = mysqli_query($con,"select sender_id from tbl_distributor_operator_master where distributor_id ='$session_dist_ver' and operator_id in (select operator_id from tbl_operator_master where operator_name='Auto Fill Transfer')");
		while($row_data = mysqli_fetch_array($check_author))
		{
			$dist_sender_id=$row_data['sender_id'];
			if($dist_sender_id=="JIONET")
				$dist_operator='JIO';
			else if($dist_sender_id=="Airtel")
				$dist_operator='Airtel';
		}
	}
	$toder_fse_detail = $_POST['json_fse_detail'];
	$json_fse=json_decode($toder_fse_detail, true);     
	foreach ($json_fse as $person_fse)
	{
		$client1 = $person_fse['key_uid'];
		$final_stock = $person_fse['final_stock']; 
		$final_amount = $person_fse['final_amount']; 
		$toder = $person_fse['json_autofill_msg'];
		$json_detail = $person_fse['josn_request_detail']; 	
		$request_type = 'Service';
		$uniqueId=uniqid();
		$uniqueId1=strtoupper($uniqueId);
		$sd="UR".$uniqueId1;
		$msg_insert_check=1;    
		foreach ($toder as $person_a)
		{
			$message_txn_id = $person_a['message_txn_id'];
			$party_phone = $person_a['party_phone'];
			$message_date = $person_a['message_date'];
			$message_time = $person_a['message_time'];
			$message_amount = $person_a['message_amount'];
			$message_price=isset($person_a['message_price']) ? $person_a['message_price'] : '0';
			$product_id=isset($person_a['product_id']) ? $person_a['product_id'] : '0';
			$first_day_msg = date('Y-m-01', strtotime($message_date));
			$last_day_msg = date('Y-m-t', strtotime($message_date));
			if($message_txn_id!='')
			{
				$select_message=mysqli_query($con,"SELECT * from `tbl_autofill_retailer_message_detail` where user_id='$client1' AND transaction_id='$message_txn_id' and distributor_id='$session_dist_ver' and message_date>='$first_day_msg' and message_date<='$last_day_msg'");
				if(mysqli_num_rows($select_message)<=0)
				{
					$query_message=mysqli_query($con,"INSERT INTO `tbl_autofill_retailer_message_detail`(`distributor_id`, `user_id`, `transaction_id`, `amount`, `party_phone`, `message_date`, `message_time`, `insert_date`, `insert_time`, `status`, `complete_date`, `complete_time`,`operator_detail`,`product_price_val`,`product_id`) VALUES ('$session_dist_ver','$client1','$message_txn_id','$message_amount','$party_phone','$message_date','$message_time','$da','$scro','Transfer','$da','$scro','$dist_operator','$message_price','$product_id')");
					$msg_insert_check=0;
				}
			}
		}
		if($msg_insert_check==0)
		{
			$res = mysqli_query($con,"insert into tbl_user_request(transaction_date,transaction_time,user_transaction_id, total_amount, user_id,request_type,`status`,complete_date,complete_time,action_source,party_id,transaction_status,`type`)values('$da','$scro','$sd','$final_amount','$client1','$request_type','Complete','$da','$scro','Admin','0','Complete','Autofill')");	
			$re = mysqli_insert_id($con);		
			if($res)
			{     
				foreach ($json_detail as $request_value)
				{
					$prodid=$request_value['pid'];
					$prodname=$request_value['pname'];
					$pro_price=$request_value['pro_price'];
					$ordquantiy=$request_value['quantity'];
					$query2=mysqli_query($con,"insert into tbl_user_request_detail(transaction_id,product_id,product_name,quantity,product_price)values('$re','$prodid','$prodname','$ordquantiy','$pro_price')");
				
					$res_stock = mysqli_query($con,"SELECT quantity FROM  tbl_user_stock where date ='$da' and user_id='$client1' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
					if(mysqli_num_rows($res_stock)>0)
					{
						$row_stock =  mysqli_fetch_assoc($res_stock);
						$stock_quantity=$row_stock['quantity'];
						$temp_quantity=round($stock_quantity+$ordquantiy,2);
						$uq=mysqli_query($con,"UPDATE tbl_user_stock SET quantity='$temp_quantity' where date ='$da' and user_id='$client1' and product_id='$prodid'");	
					}
					else
					{
						$res_stock1 = mysqli_query($con,"SELECT quantity FROM  tbl_user_stock where date <='$da' and user_id='$client1' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
						if(mysqli_num_rows($res_stock1)>0)
						{
							$row_stock1 =  mysqli_fetch_assoc($res_stock1);
							$stock_quantity=$row_stock1['quantity'];
							$temp_quantity=round($stock_quantity+$ordquantiy,2);
							$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock,quantity,date)values('$client1','$prodid','$stock_quantity','$temp_quantity','$da')");
						}
						else
						{
							$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock,quantity,date)values('$client1','$prodid','0','$ordquantiy','$da')");
						}
					}	
					$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
					$query = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id,product_id,distributor_id, quantity,transaction_date,transaction_time,txn_type,user_id,message_txn_id)values('$transaction_id','$prodid','$session_dist_ver','$ordquantiy','$da','$scro','Transfer','$client1','$message_txn_id')");
				
					$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$session_dist_ver' and product_id='$prodid' ORDER BY `date` desc limit 1");
					$row_stock =  mysqli_fetch_assoc($res_stock);
					if(mysqli_num_rows($res_stock)>0)
					{
						$stock_quantity=$row_stock['closing_stock'];
						$temp_quantity=round($stock_quantity-$ordquantiy,2);
						$uq11=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scro' where date ='$da' and distributor_id='$session_dist_ver' and product_id='$prodid'");	
						$uq21=mysqli_query($con,"update tbl_product set stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'"); 
					}
					else
					{
						$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$da' and distributor_id='$session_dist_ver' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
						$res_stock1 = mysqli_query($con,$query_stock1);
						$row_stock1 =  mysqli_fetch_assoc($res_stock1);
						if(mysqli_num_rows($res_stock1)>0)
						{
							$stock_quantity=$row_stock1['closing_stock'];
							$temp_quantity=round($stock_quantity-$ordquantiy,2);
							$stock_insert1=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$session_dist_ver','$prodid','$stock_quantity','$temp_quantity','$da','$scro')");
							$uq21=mysqli_query($con,"update tbl_product set stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'"); 
						}
					}
				}
				// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'INSERT+UPDATE OPERATION,Distributor Stock Transfer Autofill#Admin(INSERT+UPDATE)tbl_autofill_retailer_message_detail,tbl_user_request,tbl_distributor_stock,tbl_product,tbl_distributor_transaction,tbl_user_stock', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");

				$FIREBASE_API_KEY="AAAAZno7F7E:APA91bH7hbOcUWxp29ZfjJ4vQp-IMpuzZ3y5wNnIBRCzLOS3Fl7dD4RRzslJ4fxF5fIGoIHjcZ5kYPvVW8Obk7dI4moxP8BGbg3J47xHtEiOGZYTnOr60Rz3izk1axcCC_P0krknYmnw";
				$url = 'https://fcm.googleapis.com/fcm/send';
				$headers = array(
					'Authorization: key=' . $FIREBASE_API_KEY,
					'Content-Type: application/json'
				);
				$sendNotify = mysqli_query($con,"SELECT * FROM tbl_user where user_id='$client1' and status='Active'");
				$ch = curl_init ();
				while($rowNotify=mysqli_fetch_assoc($sendNotify))
				{ 
					$title="Stock Transfer status";
					$varMSG="Autofill Stock Transfer Successfully Done by the Distributor!! Please check and confirm";
					$key=$rowNotify['device_id'];
					$fields = array('to' => $key, 'notification' =>array('title'=>$title,'body'=>$varMSG));
					$payload = json_encode ( $fields );
					curl_setopt ( $ch, CURLOPT_URL, $url );
					curl_setopt ( $ch, CURLOPT_POST, true );
					curl_setopt ( $ch, CURLOPT_HTTPHEADER, $headers );
					curl_setopt ( $ch, CURLOPT_RETURNTRANSFER, true );
					curl_setopt($ch, CURLOPT_SSL_VERIFYPEER,FALSE);
					//curl_setopt($ch,CURLOPT_SSL_VERIFYHOST,0);
					curl_setopt($ch,CURLOPT_IPRESOLVE,CURL_IPRESOLVE_V4);
					curl_setopt ( $ch, CURLOPT_POSTFIELDS, $payload);
					$result = curl_exec ( $ch );
				}
				curl_close ( $ch );
			}
		}
		$response['success']='1';
		$response['details']="Stock Transfer Successfully";
	}
	
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>