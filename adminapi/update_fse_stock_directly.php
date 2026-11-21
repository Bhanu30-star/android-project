<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['user_name']) && isset($_POST['key_uid']) && isset($_POST['amount']) && isset($_POST['pid']))
{
	$client1 = $_POST['key_uid'];
	$user_name = $_POST['user_name'];
	$amount = $_POST['amount'];   
	$prodid=$_POST['pid'];
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$prodname=$_POST['pname'];
	$ordquantiy=$_POST['quantity'];
	$pro_price=$_POST['pro_price'];
	$res_check = mysqli_query($con,"SELECT * FROM tbl_product where product_id ='$prodid' and stock_quantity>='$ordquantiy'");
	if(mysqli_num_rows($res_check)>0)
	{	
		while($fetch_update=mysqli_fetch_assoc($res_check))
		{
			$set_quan=$fetch_update['stock_quantity']-$ordquantiy;
			$uq21=mysqli_query($con,"update tbl_product set stock_quantity='$set_quan',	tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$ver'"); 
		}
		$uniqueId=uniqid();
		$uniqueId1=strtoupper($uniqueId);
		$sd="UR".$uniqueId1;
		$res = mysqli_query($con,"insert into tbl_user_request(transaction_date,transaction_time,user_transaction_id, total_amount, user_id,request_type,status,complete_date,complete_time,action_source)values('$da','$scro','$sd','$amount','$client1','Service','Complete','$da','$scro','APP')");
		$query = mysqli_query($con,"insert into tbl_user_message(distributor_id, title,message,create_date,create_time,user_id)values('$ver','Stock Request Approve','Your currently submitted Stock Request is Approved.','$da','$scro','$client1')");
		if($res)
		{
			$res1 = mysqli_query($con,"SELECT * FROM  tbl_user_request where user_id ='$client1' and  user_transaction_id='$sd' ORDER BY `transaction_id` DESC LIMIT 1");
			if(mysqli_num_rows($res1)>0)
			{		
				$row =  mysqli_fetch_assoc($res1);
				$re= $row['transaction_id'];
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
					$res_stock1 = mysqli_query($con,"SELECT quantity FROM tbl_user_stock where date <='$da' and user_id='$client1' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
					if(mysqli_num_rows($res_stock1)>0)
					{
						$row_stock1 =  mysqli_fetch_assoc($res_stock1);
						$stock_quantity=$row_stock1['quantity'];
						$temp_quantity=round($stock_quantity+$ordquantiy,2);
						$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock, quantity, date)values('$client1','$prodid','$stock_quantity','$temp_quantity','$da')");
					}
					else
					{
						$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock,quantity, date)values('$client1','$prodid','0','$ordquantiy','$da')");
					}
				}
				$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
				$query = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id,product_id,distributor_id,quantity, transaction_date,transaction_time,txn_type,user_id)values('$transaction_id','$prodid','$ver','$ordquantiy','$da','$scro','Transfer','$client1')");
				
				$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$ver' and product_id='$prodid' ORDER BY `date` desc limit 1");
				$row_stock =  mysqli_fetch_assoc($res_stock);
				if(mysqli_num_rows($res_stock)>0)
				{
					$stock_quantity=$row_stock['closing_stock'];
					$temp_quantity=round($stock_quantity-$ordquantiy,2);
					$uq11=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scro' where date ='$da' and distributor_id='$ver' and product_id='$prodid'");	
					$uq21=mysqli_query($con,"update tbl_product set stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$ver'"); 
				}
				else
				{
					$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$da' and distributor_id='$ver' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
					$res_stock1 = mysqli_query($con,$query_stock1);
					$row_stock1 =  mysqli_fetch_assoc($res_stock1);
					if(mysqli_num_rows($res_stock1)>0)
					{
						$stock_quantity=$row_stock1['closing_stock'];
						$temp_quantity=round($stock_quantity-$ordquantiy,2);
						$stock_insert1=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id, opening_stock, closing_stock,date,time)values('$ver','$prodid','$stock_quantity','$temp_quantity','$da','$scro')");
						$uq21=mysqli_query($con,"update tbl_product set stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$ver'"); 
					}
				}
			}
		} 
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
			$title="Stock request status";
			$varMSG="Your Stock request ".$txn_utxn_id." has been approved!!";
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
		$response['success']='1';
		$response['details']="Request Approved Successfully";
	}
	else
	{		
		$response['success']='0';
		$response['details']="Distributor stock not available. Please add stock first and then send stock.";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>