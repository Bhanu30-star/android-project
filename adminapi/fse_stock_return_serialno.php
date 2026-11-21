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
	$json_a_check=json_decode($toder, true);  
	$flag_check_imei_stock=0;
	foreach ($json_a_check as $person_a_check)
	{
		$temp_pro_id=$person_a_check['product_id'];
		$temp_explode=$person_a_check['imei_detail'];
		$temp_explode1=explode(",",$temp_explode);
		for($jk=0;$jk<sizeof($temp_explode1);$jk++)
		{
			$imei_stock_check = mysqli_query($con,"select stock_id,status from tbl_product_serialno where product_id='$temp_pro_id' and IMEI like '%$temp_explode1[$jk]' and user_id='$uid'");
			if(mysqli_num_rows($imei_stock_check)<=0)
			{
				$flag_check_imei_stock=1;
			}
			else
			{
				while($fetch_imei_stock_check=mysqli_fetch_assoc($imei_stock_check))
				{
					if($fetch_imei_stock_check['status']=='Sold')
						$flag_check_imei_stock=1;
				}
			}
		}
	}
	if($flag_check_imei_stock==0)
	{
		foreach ($json_a_check as $person_a_check)
		{
			$temp_pro_id=$person_a_check['product_id'];
			$temp_explode=$person_a_check['imei_detail'];
			$res11 = mysqli_query($con,"select stock_quantity from tbl_product where status='Active' and distributor_id='$ver' and product_id='$temp_pro_id'");
			if(mysqli_num_rows($res11)>0)
			{
				while($fetch_product11=mysqli_fetch_assoc($res11))
				{
					$temp_quantity_temp=$fetch_product11['stock_quantity'];
				}
				$temp_explode1=explode(",",$temp_explode);
				$temp_11_quan=sizeof($temp_explode1);
				for($jk=0;$jk<sizeof($temp_explode1);$jk++)
				{
					$resReturnSerial = mysqli_query($con,"select * from tbl_product_serialno where product_id='$temp_pro_id' and IMEI like '%$temp_explode1[$jk]' and user_id='$uid'");
					while($fetchReturnSerail=mysqli_fetch_assoc($resReturnSerial))
					{
						$insert_purchase_trans=mysqli_query($con,"INSERT INTO `tbl_product_serialno_fos_return`(`stock_id`, `product_id`, `IMEI`, `status`, `unique_bill`, `insert_date`, `insert_time`, `update_datetime`, `request_id`, `user_id`, `assign_date`, `assign_time`, `return_date`, `return_time`) VALUES ('".$fetchReturnSerail['stock_id']."','".$fetchReturnSerail['product_id']."','".$fetchReturnSerail['IMEI']."','".$fetchReturnSerail['status']."','".$fetchReturnSerail['unique_bill']."','".$fetchReturnSerail['insert_date']."','".$fetchReturnSerail['insert_time']."','".$fetchReturnSerail['update_datetime']."','".$fetchReturnSerail['request_id']."','".$fetchReturnSerail['user_id']."','".$fetchReturnSerail['assign_date']."','".$fetchReturnSerail['assign_time']."','$da','$scri')");
					}
					if($insert_purchase_trans)
						$uq1=mysqli_query($con,"update tbl_product_serialno set user_id='0',assign_date='0000-00-00',assign_time='00:00:00', request_id='' where IMEI like '%$temp_explode1[$jk]' and product_id='$temp_pro_id' and user_id='$uid'"); 
				}
				$res_stock = mysqli_query($con,"SELECT quantity FROM  tbl_user_stock where date ='$da' and user_id='$uid' and product_id='$temp_pro_id' ORDER BY `date` DESC LIMIT 1");
				$row_stock =  mysqli_fetch_assoc($res_stock);
				if(mysqli_num_rows($res_stock)>0)
				{
					$stock_quantity=$row_stock['quantity'];
					$temp_quantity=$stock_quantity-$temp_11_quan;
					$uq=mysqli_query($con,"UPDATE tbl_user_stock SET quantity='$temp_quantity' where date ='$da' and user_id='$uid' and product_id='$temp_pro_id'");	
				}
				else
				{
					$res_stock1 = mysqli_query($con,"SELECT quantity FROM  tbl_user_stock where date <='$da' and user_id='$uid' and product_id='$temp_pro_id' ORDER BY `date` DESC LIMIT 1");
					$row_stock1 =  mysqli_fetch_assoc($res_stock1);
					if(mysqli_num_rows($res_stock1)>0)
					{
						$stock_quantity=$row_stock1['quantity'];
						$temp_quantity=$stock_quantity-$temp_11_quan;
						$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock,quantity,date)values('$uid','$temp_pro_id','$stock_quantity','$temp_quantity','$da')");
					}
				}
				$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
				$query = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id,product_id,distributor_id,quantity, transaction_date,transaction_time,txn_type,user_id)values('$transaction_id','$temp_pro_id','$ver','$temp_11_quan','$da','$scri','Return','$uid')");
												
				$set_quan=$temp_quantity_temp+$temp_11_quan;
				$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$set_quan',tb_updatedatetime='$cdate' where product_id='$temp_pro_id' and distributor_id='$ver'");

				$res_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date ='$da' and distributor_id='$ver' and product_id='$temp_pro_id' ORDER BY `date` DESC LIMIT 1");
				$row_stock =  mysqli_fetch_assoc($res_stock);
				if(mysqli_num_rows($res_stock)>0)
				{
					$stock_quantity=$row_stock['closing_stock'];
					$temp_quantity=$stock_quantity+$temp_11_quan;
					$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$da' and distributor_id='$ver' and product_id='$temp_pro_id'");	
				}
				else
				{
					$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date <='$da' and distributor_id='$ver' and product_id='$temp_pro_id' ORDER BY `date` DESC LIMIT 1");
					$row_stock1 =  mysqli_fetch_assoc($res_stock1);
					if(mysqli_num_rows($res_stock1)>0)
					{
						$stock_quantity=$row_stock1['closing_stock'];
						$temp_quantity=$stock_quantity+$temp_11_quan;
						$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock,date,time)values('$ver','$temp_pro_id','$stock_quantity','$temp_quantity','$da','$scri')");
					}
					else
					{
						$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock,date,time)values('$ver','$temp_pro_id','0','$temp_11_quan','$da','$scri')");
					}
				}									
			}
		}
	}
	$response['success']='1';
	$response['message']="Return Successful..!!";
}
else
{
	$response['success']='0';
	$response['details']="Required Field Missing...!!";
}	
mysqli_close($con);
echo json_encode($response);
?>