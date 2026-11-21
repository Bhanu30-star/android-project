<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['user_id']) && isset($_POST['distributor_id']) && isset($_POST['total_order']))
{
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate  = date("Y-m-d")." ".date('H:i:sa');
	$da=date("Y-m-d");
	$scri=date('H:i:sa');
	$uid=$_POST['user_id'];
	$toder = $_POST['total_order'];
	
	
	$json_a = json_decode($toder, true);
	foreach ($json_a as $person_a) 
	{
		$prodid = $person_a['product_id'];
		$ordquantiy = $person_a['quantity'];
						
		$res_stock=mysqli_query($con,"SELECT quantity FROM  tbl_user_stock where date <='$da' and user_id='$uid' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
		if(mysqli_num_rows($res_stock) > 0)
		{
			$row_stock = mysqli_fetch_assoc($res_stock);
			if($row_stock['quantity'] < $ordquantiy)
			{					
				$response['success'] = 0;
				$response['details'] = "Item Stock Missing. Please check fse stock and try again later!!";
				echo json_encode($response);
				die();
			}
		}	
	}
	
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$temp_pro_id=$person_a['product_id'];
		$temp_11=$person_a['quantity'];
		$res11 = mysqli_query($con,"select stock_quantity from tbl_product where status='Active' and distributor_id='$ver' and product_id='$temp_pro_id'");
		if(mysqli_num_rows($res11)>0)
		{
			while($fetch_product11=mysqli_fetch_assoc($res11))
			{
				$temp_quantity_temp=$fetch_product11['stock_quantity'];
			}
			$res_stock = mysqli_query($con,"SELECT * FROM  tbl_user_stock where date ='$da' and user_id='$uid' and product_id='$temp_pro_id' ORDER BY `date` DESC LIMIT 1");
			$row_stock =  mysqli_fetch_assoc($res_stock);
			if(mysqli_num_rows($res_stock)>0)
			{
				$stock_quantity=$row_stock['quantity'];
				$temp_quantity=round($stock_quantity-$temp_11,2);
				$uq=mysqli_query($con,"UPDATE tbl_user_stock SET quantity='$temp_quantity' where date ='$da' and user_id='$uid' and product_id='$temp_pro_id'");	
			}
			else
			{
				$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_user_stock where date <='$da' and user_id='$uid' and product_id='$temp_pro_id' ORDER BY `date` DESC LIMIT 1");
				$row_stock1 =  mysqli_fetch_assoc($res_stock1);
				if(mysqli_num_rows($res_stock1)>0)
				{
					$stock_quantity=$row_stock1['quantity'];
					$temp_quantity=round($stock_quantity-$temp_11,2);
					$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock,quantity,date)values('$uid','$temp_pro_id','$stock_quantity','$temp_quantity','$da')");
				}
			}
			$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
			$query = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id,product_id,distributor_id,quantity, transaction_date, transaction_time,txn_type,user_id)values('$transaction_id','$temp_pro_id','$ver','$temp_11','$da','$scri','Return','$uid')");
												
			$set_quan=round($temp_quantity_temp+$temp_11,2);
			$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$set_quan',tb_updatedatetime='$cdate' where product_id='$temp_pro_id' and distributor_id='$ver'");

			$res_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date ='$da' and distributor_id='$ver' and product_id='$temp_pro_id' ORDER BY `date` DESC LIMIT 1");
			$row_stock =  mysqli_fetch_assoc($res_stock);
			if(mysqli_num_rows($res_stock)>0)
			{										
				$stock_quantity=$row_stock['closing_stock'];
				$temp_quantity=round($stock_quantity+$temp_11,2);
				$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$da' and distributor_id='$ver' and product_id='$temp_pro_id'");	
			}
			else
			{
				$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date <='$da' and distributor_id='$ver' and product_id='$temp_pro_id' ORDER BY `date` DESC LIMIT 1");
				$row_stock1 =  mysqli_fetch_assoc($res_stock1);
				if(mysqli_num_rows($res_stock1)>0)
				{
					$stock_quantity=$row_stock1['closing_stock'];
					$temp_quantity=round($stock_quantity+$temp_11,2);
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock, date,time)values('$ver','$temp_pro_id','$stock_quantity','$temp_quantity','$da','$scri')");
				}
				else
				{
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock, date,time)values('$ver','$temp_pro_id','0','$temp_11','$da','$scri')");
				}
			}									
		}
	}
	$response['success']='1';
	$response['details']="Return Successful..!!";
}
else
{
	$response['success']='0';
	$response['details']="Required Field Missing...!!";
}	
mysqli_close($con);
echo json_encode($response);
?>