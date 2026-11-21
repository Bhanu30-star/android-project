<?php
ob_start();
class Collection
{
	function cashcollection($distributor_id, $amount, $date)
	{
		ob_start();
		include("../../connect.php");

		$scro = date("h:i:sa");
		$da  = date("Y-m-d");
		$res_check1st = mysqli_query($con, "SELECT * FROM  tbl_distributor_cash_collection where distributor_id='$distributor_id'");
		if (mysqli_num_rows($res_check1st) > 0) {
			$res_check = mysqli_query($con, "SELECT * FROM  tbl_distributor_cash_collection where distributor_id='$distributor_id' and date='$date'");
			if (mysqli_num_rows($res_check) > 0) {
				$uq_1 = mysqli_query($con, "update tbl_distributor_cash_collection SET opening_amt=round(opening_amt+'$amount',2),closing_amt=round(closing_amt+'$amount',2) where distributor_id='$distributor_id' and date>'$date'");

				$uq_1 = mysqli_query($con, "update tbl_distributor_cash_collection SET closing_amt=round(closing_amt+'$amount',2) where distributor_id='$distributor_id' and date='$date'");
			} else {
				$res_check_2nd = mysqli_query($con, "SELECT * FROM  tbl_distributor_cash_collection where  distributor_id='$distributor_id' and date<'$date' ORDER BY date DESC LIMIT 1");
				if (mysqli_num_rows($res_check_2nd) > 0) {
					$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
					$total_amount = round($rows_res_check['closing_amt'] + $amount, 2);
					$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_cash_collection(distributor_id, opening_amt,closing_amt,date) VALUES ('$distributor_id'," . $rows_res_check['closing_amt'] . ",'$total_amount','$date')");

					$uq_1 = mysqli_query($con, "update tbl_distributor_cash_collection SET opening_amt=round(opening_amt+'$amount',2),closing_amt=round(closing_amt+'$amount',2) where distributor_id='$distributor_id' and date>'$date'");
				} else {
					$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_cash_collection(distributor_id, opening_amt,closing_amt,date) VALUES ('$distributor_id','0','$amount','$date')");

					$uq_1 = mysqli_query($con, "update tbl_distributor_cash_collection SET opening_amt=round(opening_amt+'$amount',2),closing_amt=round(closing_amt+'$amount',2) where distributor_id='$distributor_id' and date>'$date'");
				}
			}
		} else {
			$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_cash_collection(distributor_id, opening_amt,closing_amt,date) VALUES ('$distributor_id','0','$amount','$date')");
		}
		return 1;
	}
	function bankcollection($distributor_id, $bank_id, $amount, $date)
	{
		ob_start();
		include("../../connect.php");

		$scro = date("h:i:sa");
		$da  = date("Y-m-d");
		$res_check1st = mysqli_query($con, "SELECT * FROM  tbl_distributor_bank_collection where distributor_id='$distributor_id' AND bank_id='$bank_id'");
		if (mysqli_num_rows($res_check1st) > 0) {
			$res_check = mysqli_query($con, "SELECT * FROM  tbl_distributor_bank_collection where  distributor_id='$distributor_id' and date='$date' AND bank_id='$bank_id'");
			if (mysqli_num_rows($res_check) > 0) {
				$uq_1 = mysqli_query($con, "update tbl_distributor_bank_collection SET opening_amt=round(opening_amt+'$amount',2),closing_amt=round(closing_amt+'$amount',2) where distributor_id='$distributor_id' and date>'$date' AND bank_id='$bank_id'");

				$uq_1 = mysqli_query($con, "update tbl_distributor_bank_collection SET closing_amt=round(closing_amt+'$amount',2) where distributor_id='$distributor_id' and date='$date' AND bank_id='$bank_id'");
			} else {
				$res_check_2nd = mysqli_query($con, "SELECT * FROM  tbl_distributor_bank_collection where  distributor_id='$distributor_id' and date<'$date' AND bank_id='$bank_id' ORDER BY date DESC LIMIT 1");
				if (mysqli_num_rows($res_check_2nd) > 0) {
					$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
					$total_amount = round($rows_res_check['closing_amt'] + $amount, 2);
					$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_bank_collection(distributor_id, bank_id, opening_amt,closing_amt,date) VALUES ('$distributor_id','$bank_id'," . $rows_res_check['closing_amt'] . ",'$total_amount','$date')");

					$uq_1 = mysqli_query($con, "update tbl_distributor_bank_collection SET opening_amt=round(opening_amt+'$amount',2),closing_amt=round(closing_amt+'$amount',2) where distributor_id='$distributor_id' and date>'$date'");
				} else {
					$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_bank_collection(distributor_id, bank_id, opening_amt,closing_amt,date) VALUES ('$distributor_id','$bank_id','0','$amount','$date')");

					$uq_1 = mysqli_query($con, "update tbl_distributor_bank_collection SET opening_amt=round(opening_amt+'$amount',2),closing_amt=round(closing_amt+'$amount',2) where distributor_id='$distributor_id' and date>'$date' AND bank_id='$bank_id'");
				}
			}
		} else {
			$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_bank_collection(distributor_id, bank_id, opening_amt,closing_amt,date) VALUES ('$distributor_id','$bank_id','0','$amount','$date')");
		}
		return 1;
	}
	function purchasecashcollection($distributor_id, $amount, $date)
	{

		ob_start();
		include("../../connect.php");

		$scro = date("h:i:sa");
		$da  = date("Y-m-d");
		$res_check1st = mysqli_query($con, "SELECT * FROM  tbl_distributor_cash_collection where distributor_id='$distributor_id'");
		if (mysqli_num_rows($res_check1st) > 0) {
			$res_check = mysqli_query($con, "SELECT * FROM  tbl_distributor_cash_collection where  distributor_id='$distributor_id' and date='$date'");
			if (mysqli_num_rows($res_check) > 0) {
				$uq_1 = mysqli_query($con, "update tbl_distributor_cash_collection SET opening_amt=round(opening_amt-'$amount',2),closing_amt=round(closing_amt-'$amount',2) where distributor_id='$distributor_id' and date>'$date'");

				$uq_1 = mysqli_query($con, "update tbl_distributor_cash_collection SET closing_amt=round(closing_amt-'$amount',2) where distributor_id='$distributor_id' and date='$date'");
			} else {
				$res_check_2nd = mysqli_query($con, "SELECT * FROM  tbl_distributor_cash_collection where  distributor_id='$distributor_id' and date<'$date' ORDER BY date DESC LIMIT 1");
				if (mysqli_num_rows($res_check_2nd) > 0) {
					$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
					$total_amount = round($rows_res_check['closing_amt'] - $amount, 2);
					$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_cash_collection(distributor_id, opening_amt,closing_amt,date) VALUES ('$distributor_id'," . $rows_res_check['closing_amt'] . ",'$total_amount','$date')");

					$uq_1 = mysqli_query($con, "update tbl_distributor_cash_collection SET opening_amt=round(opening_amt-'$amount',2),closing_amt=round(closing_amt-'$amount',2) where distributor_id='$distributor_id' and date>'$date'");
				} else {
					$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_cash_collection(distributor_id, opening_amt,closing_amt,date) VALUES ('$distributor_id','0','-$amount','$date')");

					$uq_1 = mysqli_query($con, "update tbl_distributor_cash_collection SET opening_amt=round(opening_amt-'$amount',2),closing_amt=round(closing_amt-'$amount',2) where distributor_id='$distributor_id' and date>'$date'");
				}
			}
		} else {
			$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_cash_collection(distributor_id, opening_amt,closing_amt,date) VALUES ('$distributor_id','0','-$amount','$date')");
		}
		return 1;
	}
	function purchasebankcollection($distributor_id, $bank_id, $amount, $date)
	{

		ob_start();
		include("../../connect.php");

		$scro = date("h:i:sa");
		$da  = date("Y-m-d");
		$res_check1st = mysqli_query($con, "SELECT * FROM  tbl_distributor_bank_collection where distributor_id='$distributor_id' AND bank_id='$bank_id'");
		if (mysqli_num_rows($res_check1st) > 0) {
			$res_check = mysqli_query($con, "SELECT * FROM  tbl_distributor_bank_collection where  distributor_id='$distributor_id' and date='$date' AND bank_id='$bank_id'");
			if (mysqli_num_rows($res_check) > 0) {
				$uq_1 = mysqli_query($con, "update tbl_distributor_bank_collection SET opening_amt=round(opening_amt-'$amount',2),closing_amt=round(closing_amt-'$amount',2) where distributor_id='$distributor_id' and date>'$date' AND bank_id='$bank_id'");

				$uq_1 = mysqli_query($con, "update tbl_distributor_bank_collection SET closing_amt=round(closing_amt-'$amount',2) where distributor_id='$distributor_id' and date='$date' AND bank_id='$bank_id'");
			} else {
				$res_check_2nd = mysqli_query($con, "SELECT * FROM  tbl_distributor_bank_collection where distributor_id='$distributor_id' and date<'$date' AND bank_id='$bank_id' ORDER BY date DESC LIMIT 1");
				if (mysqli_num_rows($res_check_2nd) > 0) {
					$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
					$total_amount = round($rows_res_check['closing_amt'] - $amount, 2);
					$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_bank_collection(distributor_id, bank_id, opening_amt,closing_amt,date) VALUES ('$distributor_id','$bank_id'," . $rows_res_check['closing_amt'] . ",'$total_amount','$date')");

					$uq_1 = mysqli_query($con, "update tbl_distributor_bank_collection SET opening_amt=round(opening_amt-'$amount',2),closing_amt=round(closing_amt-'$amount',2) where distributor_id='$distributor_id' and date>'$date'");
				} else {
					$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_bank_collection(distributor_id, bank_id, opening_amt,closing_amt,date) VALUES ('$distributor_id','$bank_id','0','-$amount','$date')");

					$uq_1 = mysqli_query($con, "update tbl_distributor_bank_collection SET opening_amt=round(opening_amt-'$amount',2),closing_amt=round(closing_amt-'$amount',2) where distributor_id='$distributor_id' and date>'$date' AND bank_id='$bank_id'");
				}
			}
		} else {
			$query1 = mysqli_query($con, "INSERT INTO tbl_distributor_bank_collection(distributor_id, bank_id, opening_amt,closing_amt,date) VALUES ('$distributor_id','$bank_id','0','-$amount','$date')");
		}
		return 1;
	}
}
